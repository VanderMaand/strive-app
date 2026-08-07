
-- STRIVE Database Schema (Adjusted)

CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    patient_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    diagnosis TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE therapy_sessions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    stage INTEGER,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT
);

CREATE TABLE sensor_data (
    id BIGSERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES therapy_sessions(id),
    ecg FLOAT,
    finger_angle FLOAT,
    elbow_angle FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recovery_scores (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES therapy_sessions(id),
    score FLOAT,
    level VARCHAR(50),
    confidence FLOAT,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_recommendations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    session_id INTEGER REFERENCES therapy_sessions(id),
    recommendation TEXT,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_analysis (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES therapy_sessions(id),
    prompt TEXT,
    response TEXT,
    model_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sample data
INSERT INTO patients
(patient_code, full_name, age, gender, diagnosis)
VALUES
('P001','Pasien Uji',55,'Laki-laki','Stroke Iskemik');

INSERT INTO therapy_sessions
(patient_id,start_time,stage,status,notes)
VALUES
(1,NOW(),1,'ACTIVE','Session awal rehabilitasi');
