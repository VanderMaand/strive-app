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
    const rows = await query<PatientRow>(`
      SELECT
          p.id,
          p.full_name AS name,
          p.diagnosis,

          s.id AS session_id,
          s.start_time AS started_at,

          NULL AS duration_min,
          NULL AS finger_movement_pct,
          NULL AS elbow_movement_pct,
          NULL AS consistency_pct

      FROM patients p

      LEFT JOIN therapy_sessions s
          ON s.patient_id = p.id

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

// POST /api/patients
export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        status: "disconnected",
        message: "DATABASE_URL belum diisi.",
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);

  if (!body?.name) {
    return NextResponse.json(
      {
        status: "error",
        message: "Field 'name' wajib diisi.",
      },
      { status: 400 }
    );
  }

  try {
    await query(
      `
      INSERT INTO patients
      (
        patient_code,
        full_name,
        diagnosis
      )
      VALUES
      (
        $1,
        $2,
        $3
      )
      `,
      [
        body.patientCode ?? `PAT-${Date.now()}`,
        body.name,
        body.diagnosis ?? null,
      ]
    );

    return NextResponse.json(
      {
        status: "ok",
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: (err as Error).message,
      },
      { status: 500 }
    );
  }
}