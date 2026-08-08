import { NextRequest, NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        status: "disconnected",
        message: "DATABASE_URL belum diisi.",
      },
      { status: 503 }
    );
  }

  const patientId = req.nextUrl.searchParams.get("patientId");

  try {
    const patientCount = await query<{ total: string }>(`
      SELECT COUNT(*) AS total
      FROM patients
    `);

    const activeSessionCount = await query<{ total: string }>(`
      SELECT COUNT(*) AS total
      FROM therapy_sessions
      WHERE end_time IS NULL
    `);

    // Total sesi yang sudah dijalankan pasien yang sedang dipilih
    const patientSessionCount = patientId
      ? await query<{ total: string }>(
          `
          SELECT COUNT(*) AS total
          FROM therapy_sessions
          WHERE patient_id = $1
          `,
          [patientId]
        )
      : [{ total: "0" }];

    // Sesi aktif (belum ditutup) milik pasien yang sedang dipilih
    const activeSession = patientId
      ? await query<{ id: number }>(
          `
          SELECT id
          FROM therapy_sessions
          WHERE patient_id = $1 AND end_time IS NULL
          ORDER BY id DESC
          LIMIT 1
          `,
          [patientId]
        )
      : [];

    // Sesi terakhir milik pasien ini, aktif ataupun sudah selesai
    // (dipakai untuk menampilkan data "latest" walau terapi sedang tidak berjalan)
    const latestSessionRow = patientId
      ? await query<{ id: number }>(
          `
          SELECT id
          FROM therapy_sessions
          WHERE patient_id = $1
          ORDER BY id DESC
          LIMIT 1
          `,
          [patientId]
        )
      : [];

    const activeSessionId = activeSession[0]?.id ?? null;
    const sessionId = latestSessionRow[0]?.id ?? null;

    let latestSensor: {
      ecg: number;
      finger_angle: number;
      elbow_angle: number;
      created_at: string;
    }[] = [];
    if (sessionId) {
      latestSensor = await query<{
        ecg: number;
        finger_angle: number;
        elbow_angle: number;
        created_at: string;
      }>(
        `
        SELECT
          ecg,
          finger_angle,
          elbow_angle,
          created_at
        FROM sensor_data
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [sessionId]
      );
    }

    let latestRecovery: {
      score: number;
      level: string;
      recommendation: string;
    }[] = [];
    if (sessionId) {
      latestRecovery = await query<{
        score: number;
        level: string;
        recommendation: string;
      }>(
        `
        SELECT
          score,
          level,
          recommendation
        FROM recovery_scores
        WHERE session_id = $1
        ORDER BY id DESC
        LIMIT 1
        `,
        [sessionId]
      );
    }

    let latestAI: {
      recommendation: string;
      source: string;
    }[] = [];
    if (sessionId) {
      latestAI = await query<{
        recommendation: string;
        source: string;
      }>(
        `
        SELECT
          recommendation,
          source
        FROM ai_recommendations
        WHERE session_id = $1
        ORDER BY id DESC
        LIMIT 1
        `,
        [sessionId]
      );
    }

    return NextResponse.json({
      status: "connected",
      therapyRunning: activeSessionId !== null,
      sessionId: activeSessionId,
      patientId: patientId ? Number(patientId) : null,
      patientSessions: Number(patientSessionCount[0]?.total ?? 0),
      totalPatients: Number(patientCount[0]?.total ?? 0),
      activeSessions: Number(activeSessionCount[0]?.total ?? 0),
      latestECG: latestSensor[0]?.ecg ?? null,
      latestFingerAngle: latestSensor[0]?.finger_angle ?? null,
      latestElbowAngle: latestSensor[0]?.elbow_angle ?? null,
      latestRecoveryScore: latestRecovery[0]?.score ?? null,
      latestRecoveryLevel: latestRecovery[0]?.level ?? null,
      latestRecoveryRecommendation: latestRecovery[0]?.recommendation ?? null,
      latestAIRecommendation: latestAI[0]?.recommendation ?? null,
      latestAISource: latestAI[0]?.source ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}