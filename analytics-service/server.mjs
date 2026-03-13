// server.mjs
// Point: Node.js runtime characteristics (Express)
import express from "express";

const app = express();
app.use(express.json());

const PORT = 3000;

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    uptime: process.uptime(), // Memberitahu sudah berapa lama server nyala
    message: "Analytics Service is ready",
  });
});
// Endpoint untuk menerima log dari Deno (Edge)

let stats = {
  totalLogs: 0,
  regions: {}, // Untuk menghitung jumlah per wilayah
  latencySum: 0, // Untuk menghitung rata-rata latency global
};

app.post("/collect", async (req, res) => {
  const { region, latency } = req.body;

  stats.totalLogs++;
  stats.latencySum += latency;

  const averageLatency = (stats.latencySum / stats.totalLogs).toFixed(2);

  console.log(`Total Data Masuk: ${stats.totalLogs}`);
  console.log(`Rata-rata Latency Global: ${averageLatency}ms`);

  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`Node.js Analytics Service jalan di http://localhost:${PORT}`);
});
