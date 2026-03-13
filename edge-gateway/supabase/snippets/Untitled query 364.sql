CREATE VIEW project_performance_summary AS
SELECT 
  p.name AS project_name,
  COUNT(l.id) AS total_requests,
  ROUND(AVG(l.latency), 2) AS avg_latency,
  MAX(l.latency) AS max_latency
FROM projects p
LEFT JOIN analytics_logs l ON p.id = l.project_id
GROUP BY p.id, p.name;