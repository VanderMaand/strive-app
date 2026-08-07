import { NextRequest, NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";

// POST /api/sessions
// Membuat sesi terapi baru

export async function POST(req: NextRequest) {

  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        status: "disconnected",
        message: "DATABASE_URL belum diisi."
      },
      {
        status: 503
      }
    );
  }

  const body =
    await req.json()
      .catch(() => null);

  if (!body?.patientId) {

    return NextResponse.json(
      {
        status: "error",
        message:
          "Field 'patientId' wajib diisi."
      },
      {
        status: 400
      }
    );

  }

  try {

    const rows =
      await query<{ id: number }>(
        `
        INSERT INTO therapy_sessions
        (
          patient_id,
          start_time,
          stage,
          notes
        )
        VALUES
        (
          $1,
          NOW(),
          $2,
          $3
        )
        RETURNING id
        `,
        [
          body.patientId,
          body.stage ?? 1,
          body.notes ?? null
        ]
      );

    return NextResponse.json(
      {
        status: "ok",
        sessionId: rows[0].id
      },
      {
        status: 201
      }
    );

  }
  catch(error)
  {

    return NextResponse.json(
      {
        status: "error",
        message:
          (error as Error).message
      },
      {
        status: 500
      }
    );

  }

}

// PATCH /api/sessions
// Menutup sesi terapi + menghitung recovery + menyimpan rekomendasi AI

export async function PATCH(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        status: "disconnected",
        message: "DATABASE_URL belum diisi.",
      },
      {
        status: 503,
      }
    );
  }

  const body = await req.json().catch(() => null);

  if (!body?.sessionId) {
    return NextResponse.json(
      {
        status: "error",
        message: "Field 'sessionId' wajib diisi.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    // 1. Tutup sesi terapi
    await query(
      `
      UPDATE therapy_sessions
      SET
        end_time = NOW(),
        notes = COALESCE($2, notes)
      WHERE id = $1
      `,
      [
        body.sessionId,
        body.notes ?? null,
      ]
    );

    // 2. Ambil data sensor terakhir dari sesi
    const sensor = await query<{
      finger_angle: number | null;
      elbow_angle: number | null;
    }>(
      `
      SELECT
        finger_angle,
        elbow_angle
      FROM sensor_data
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [body.sessionId]
    );

    // Default jika belum ada data sensor
    let score = 0;
    let level = "Poor";
    let recommendation = "Belum ada data sensor yang cukup.";

    // 3. Hitung recovery jika sensor tersedia
    if (sensor.length > 0) {
      const finger = Number(sensor[0].finger_angle ?? 0);
      const elbow = Number(sensor[0].elbow_angle ?? 0);

      if (finger > 60 && elbow > 90) {
        score = 90;
        level = "Good";
        recommendation =
          "Pasien menunjukkan perkembangan sangat baik.";
      } else if (finger > 30 && elbow > 45) {
        score = 70;
        level = "Moderate";
        recommendation =
          "Lanjutkan terapi Stage 2.";
      } else {
        score = 40;
        level = "Poor";
        recommendation =
          "Fokus latihan ROM dasar.";
      }
    }

    // 4. Simpan recovery score
    await query(
      `
      INSERT INTO recovery_scores
      (
        session_id,
        score,
        level,
        recommendation
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      `,
      [
        body.sessionId,
        score,
        level,
        recommendation,
      ]
    );

    // 5. Ambil patient_id dari session
    const patient = await query<{
      patient_id: number;
    }>(
      `
      SELECT patient_id
      FROM therapy_sessions
      WHERE id = $1
      `,
      [body.sessionId]
    );

    // 6. Simpan rekomendasi AI
    if (patient.length > 0) {
      await query(
        `
        INSERT INTO ai_recommendations
        (
          patient_id,
          session_id,
          recommendation,
          source
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )
        `,
        [
          patient[0].patient_id,
          body.sessionId,
          recommendation,
          "STRIVE AI",
        ]
      );
    }

    // 7. Return dilakukan PALING AKHIR
    return NextResponse.json({
      status: "ok",
      sessionId: body.sessionId,
      recovery: {
        score,
        level,
        recommendation,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: (error as Error).message,
      },
      {
        status: 500,
      }
    );
  }
}

