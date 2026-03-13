import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 10, // 10 virtual users
  duration: "10s", // jalan selama 10 detik
};

export default function () {
  const payload = JSON.stringify({
    region: "ID",
    duration: 50,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post("http://localhost:3000/collect", payload, params);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
