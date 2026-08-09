-- ================================================
-- DATA DUMMY UNTUK UJI THRESHOLD AI RECOMMENDATION
-- ================================================
-- Threshold di recovery-engine.js / PATCH /api/sessions:
--   finger > 60 DAN elbow > 90  -> score 90, level "Good"
--   finger > 30 DAN elbow > 45  -> score 70, level "Moderate"
--   selain itu                  -> score 40, level "Poor"
--
-- Threshold di ai-engine.js (dibaca dari recovery_scores.score):
--   score >= 80  -> "progres baik, lanjutkan Stage 2"
--   score >= 60  -> "progres sedang, fokus ROM siku"
--   score < 60   -> "perlu latihan dasar & pengawasan"

-- 1. Pastikan ada 1 pasien uji coba (skip kalau sudah ada pasien)
INSERT INTO patients (patient_code, full_name, age, gender, diagnosis)
VALUES ('TEST001', 'Pasien Uji Coba', 55, 'Laki-laki', 'Stroke ringan')
RETURNING id;
-- Catat id yang muncul, dipakai di bawah sebagai :patient_id
-- (kalau pakai psql interaktif, ganti manual angka 1 di bawah sesuai id asli)

-- ================================================
-- SKENARIO 1: GOOD (score 90, finger > 60, elbow > 90)
-- ================================================
INSERT INTO therapy_sessions (patient_id, start_time, end_time, stage, notes)
VALUES (1, NOW() - INTERVAL '10 minutes', NOW(), 2, 'Skenario Good')
RETURNING id;
-- misal hasilnya session id = 101

INSERT INTO sensor_data (session_id, ecg, finger_angle, elbow_angle)
VALUES (101, 75, 70, 100);

INSERT INTO recovery_scores (session_id, score, level, recommendation)
VALUES (101, 90, 'Good', 'Pasien menunjukkan perkembangan sangat baik.');

-- ================================================
-- SKENARIO 2: MODERATE (score 70, finger > 30, elbow > 45)
-- ================================================
INSERT INTO therapy_sessions (patient_id, start_time, end_time, stage, notes)
VALUES (1, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '10 minutes', 1, 'Skenario Moderate')
RETURNING id;
-- misal hasilnya session id = 102

INSERT INTO sensor_data (session_id, ecg, finger_angle, elbow_angle)
VALUES (102, 78, 40, 60);

INSERT INTO recovery_scores (session_id, score, level, recommendation)
VALUES (102, 70, 'Moderate', 'Lanjutkan terapi Stage 2.');

-- ================================================
-- SKENARIO 3: POOR (score 40, finger <= 30 atau elbow <= 45)
-- ================================================
INSERT INTO therapy_sessions (patient_id, start_time, end_time, stage, notes)
VALUES (1, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '20 minutes', 1, 'Skenario Poor')
RETURNING id;
-- misal hasilnya session id = 103

INSERT INTO sensor_data (session_id, ecg, finger_angle, elbow_angle)
VALUES (103, 82, 15, 20);

INSERT INTO recovery_scores (session_id, score, level, recommendation)
VALUES (103, 40, 'Poor', 'Fokus latihan ROM dasar.');
