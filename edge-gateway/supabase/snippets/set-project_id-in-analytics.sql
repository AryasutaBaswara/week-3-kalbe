-- Isi semua project_id yang NULL dengan ID dari project 'Web Utama Kalbe'
-- Asumsinya ID project tersebut adalah 1
UPDATE analytics_logs 
SET project_id = (SELECT id FROM projects WHERE name = 'Web Utama Kalbe' LIMIT 1)
WHERE project_id IS NULL;