-- Menambah kolom project_id yang merujuk ke tabel projects
ALTER TABLE analytics_logs 
ADD COLUMN project_id INTEGER REFERENCES projects(id);