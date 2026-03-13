import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 15,
  duration: "20s",
};

export default function () {
  const res = http.post(
    "http://127.0.0.1:54321/functions/v1/analytics-gateway",
    null,
    {
      headers: {
        Authorization: "Bearer RAHASIA_123",
      },
    },
  );

  console.log("STATUS:", res.status);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
