-- Membuat tabel induk
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Masukkan data contoh untuk testing
INSERT INTO projects (name, api_key) 
VALUES ('Web Utama Kalbe', 'RAHASIA_123');