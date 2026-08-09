import { NextRequest, NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { status: "disconnected", message: "DATABASE_URL belum diisi." },
      { status: 503 }
    );
  }

  try {
    const patientRows = await query<{
      id: number;
      full_name: string;
      age: number;
      gender: string;
      diagnosis: string;
    }>(
      `
      SELECT id, full_name, age, gender, diagnosis
      FROM patients
      WHERE id = $1
      `,
      [params.id]
    );

    if (patientRows.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Pasien tidak ditemukan." },
        { status: 404 }
      );
    }

    const sessionRows = await query<{
      id: number;
      start_time: string;
      end_time: string | null;
      stage: number;
      notes: string;
    }>(
      `
      SELECT id, start_time, end_time, stage, notes
      FROM therapy_sessions
      WHERE patient_id = $1
      ORDER BY start_time ASC
      `,
      [params.id]
    );

    return NextResponse.json({
      status: "ok",
      patient: patientRows[0],
      sessions: sessionRows,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
