// index.ts
import { getSupabaseClient } from "./supabase-client.ts";
import { Project } from "./types.ts";

const checkNodeHealth = async () => {
  const baseUrl =
    Deno.env.get("ANALYTICS_SERVICE_URL")?.split("/collect")[0] || "";
  const url = `${baseUrl}/health`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      console.log("✅ Analytics Service is Healthy");
    } else {
      // Tambahkan status code biar jelas salahnya dimana
      console.warn(`⚠️ Analytics Service returned status: ${res.status}`);
    }
  } catch (err) {
    console.error("❌ Analytics Service is DOWN or Unreachable");
  }
};

// Jalankan pengecekan
checkNodeHealth();

const cache = new Map<string, { data: any; expiry: number }>();

let activeInserts = 0;
const MAX_CONCURRENT_INSERT = 50; // coba 20–100

async function safeInsert(supabase: any, payload: any) {
  if (activeInserts >= MAX_CONCURRENT_INSERT) {
    return; // drop log kalau DB lagi penuh
  }

  activeInserts++;

  try {
    await supabase.from("analytics_logs").insert(payload);
  } catch (err) {
    console.error("Insert error:", err);
  } finally {
    activeInserts--;
  }
}

let totalRequests = 0;
let totalErrors = 0;

// Di dalam Deno.serve, sebelum panggil Supabase:
Deno.serve(async (req) => {
  const start = Date.now();
  try {
    totalRequests++;

    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }

    if (url.pathname.endsWith("/metrics")) {
      return new Response(
        JSON.stringify({
          totalRequests,
          totalErrors,
          uptime: performance.now(),
        }),
        { status: 200 },
      );
    }

    const supabase = getSupabaseClient();
    // 1. Auth Logic
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) return new Response("Missing Token", { status: 401 });

    const { data, error: authError } = await supabase
      .from("projects")
      .select("id, name")
      .eq("api_key", token)
      .single();

    if (authError || !data) {
      return new Response("Unauthorized", { status: 401 });
    }

    const project = data;

    // 3. Database & External Service Reporting
    const region = req.headers.get("cf-ipcountry") || "Localhost";
    const latency = Date.now() - start;

    // Jalankan DB Insert dan Fetch secara paralel agar lebih cepat

    // Kita bungkus proses eksternal agar tidak menghentikan arus utama
    Promise.allSettled([
      safeInsert(supabase, [{ region, latency, project_id: project?.id }]),
      fetch(Deno.env.get("ANALYTICS_SERVICE_URL") || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: project?.name, region, latency }),
      }),
    ]).then((results) => {
      // Ini berjalan di background, tidak menghambat response ke user
      const dbResult = results[0];
      if (
        dbResult.status === "rejected" ||
        (dbResult.value && dbResult.value.error)
      ) {
        console.error(
          "⚠️ Background Logging Failed:",
          dbResult.status === "rejected"
            ? dbResult.reason
            : dbResult.value.error,
        );
      } else {
        console.log("✅ Background analytics processed");
      }
    });

    const totalDuration = Date.now() - start;

    if (totalDuration > 500) {
      console.warn(`⚠️ BOTTLENECK DETECTED: Request took ${totalDuration}ms!`);
    }

    console.log(
      JSON.stringify({
        method: req.method,
        path: new URL(req.url).pathname,
        status: 200,
        duration: totalDuration,
        timestamp: new Date().toISOString(),
      }),
    );

    return new Response(JSON.stringify({ status: "processed" }), {
      status: 200,
    });
  } catch (err) {
    totalErrors++;
    console.error("❌ UNHANDLED ERROR:", err);

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
});
