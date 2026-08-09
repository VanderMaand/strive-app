import { NextRequest, NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";
import { Patient } from "@/lib/types";

type PatientRow = {
  id: number;
  name: string;
  diagnosis: string | null;
  session_id: number | null;
  started_at: string | null;
  duration_min: number | null;
  finger_movement_pct: number | null;
  elbow_movement_pct: number | null;
  consistency_pct: number | null;
};

function groupRows(rows: PatientRow[]): Patient[] {
  const byId = new Map<number, Patient>();
  for (const r of rows) {
    if (!byId.has(r.id)) {
      byId.set(r.id, {
        id: String(r.id),
        name: r.name,
        diagnosis: r.diagnosis ?? "",
        sessionsCompleted: 0,
        lastSession: "",
        sessions: [],
      });
    }
    const p = byId.get(r.id)!;
    if (r.session_id) {
      p.sessions.push({
        id: String(r.session_id),
        date: r.started_at ?? "",
        durationMin: r.duration_min ?? 0,
        fingerMovement: Number(r.finger_movement_pct ?? 0),
        elbowMovement: Number(r.elbow_movement_pct ?? 0),
        consistency: Number(r.consistency_pct ?? 0),
      });
    }
  }
  return Array.from(byId.values()).map((p) => ({
    ...p,
    sessionsCompleted: p.sessions.length,
    lastSession:
      p.sessions.length > 0
        ? p.sessions[p.sessions.length - 1].date
        : "",
  }));
}

// GET /api/patients
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        status: "disconnected",
        message: "DATABASE_URL belum diisi.",
        patients: [],
      },
      { status: 200 }
    );
  }

  try {
    // sebelumnya semua kolom ini hardcode NULL.
    // Sekarang diambil dari agregat sensor_data per sesi:
    //   - duration_min  : selisih start_time & end_time sesi (menit)
    //   - finger/elbow   : rata-rata sudut sensor, dinormalisasi ke persen
    //                      (max sama dengan JointAngleGauge di UI: 90° dan 130°)
    //   - consistency    : 100 dikurangi variasi (stddev) relatif terhadap rata-rata,
    //                      dibatasi 0-100 (semakin stabil gerakannya, semakin tinggi)
    const rows = await query<PatientRow>(`
      SELECT
          p.id,
          p.full_name AS name,
          p.diagnosis,
          s.id AS session_id,
          s.start_time AS started_at,
          CASE
            WHEN s.end_time IS NOT NULL
            THEN EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60
            ELSE NULL
          END AS duration_min,
          LEAST(100, GREATEST(0, (agg.avg_finger / 90.0) * 100)) AS finger_movement_pct,
          LEAST(100, GREATEST(0, (agg.avg_elbow / 130.0) * 100)) AS elbow_movement_pct,
          LEAST(
            100,
            GREATEST(
              0,
              100 - COALESCE(
                (
                  (agg.stddev_finger + agg.stddev_elbow)
                  / NULLIF(agg.avg_finger + agg.avg_elbow, 0)
                ) * 100,
                0
              )
            )
          ) AS consistency_pct
      FROM patients p
      LEFT JOIN therapy_sessions s
          ON s.patient_id = p.id
      LEFT JOIN LATERAL (
          SELECT
              AVG(finger_angle) AS avg_finger,
              AVG(elbow_angle) AS avg_elbow,
              COALESCE(STDDEV(finger_angle), 0) AS stddev_finger,
              COALESCE(STDDEV(elbow_angle), 0) AS stddev_elbow
          FROM sensor_data sd
          WHERE sd.session_id = s.id
      ) agg ON TRUE
      ORDER BY
          p.full_name,
          s.start_time ASC
    `);

    return NextResponse.json({
      status: "connected",
      patients: groupRows(rows),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: (err as Error).message,
        patients: [],
      },
      { status: 500 }
    );
  }
}
