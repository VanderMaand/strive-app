import { NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {

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

  try {

    const patientCount =
      await query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM patients
        `
      );

    const activeSessionCount =
      await query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM therapy_sessions
        WHERE end_time IS NULL
        `
      );

  const activeSession =
  await query<{
    id: number;
  }>(
    `
    SELECT id
    FROM therapy_sessions
    WHERE end_time IS NULL
    ORDER BY id DESC
    LIMIT 1
    `
  );

  const sessionId =
  activeSession[0]?.id ?? null;

  let latestSensor: any[] = [];

if (sessionId) {

  latestSensor =
    await query<{
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

  latestRecovery =
    await query<{
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

    let latestAI: any[] = [];

if (sessionId) {

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

}
    
    return NextResponse.json({

  status: "connected",

  therapyRunning:
    sessionId !== null,

  totalPatients:
    Number(
      patientCount[0]?.total ?? 0
    ),

  activeSessions:
    Number(
      activeSessionCount[0]?.total ?? 0
    ),

      latestECG:
        latestSensor[0]?.ecg ?? null,

      latestFingerAngle:
        latestSensor[0]?.finger_angle ?? null,

      latestElbowAngle:
        latestSensor[0]?.elbow_angle ?? null,

      latestRecoveryScore:
        latestRecovery[0]?.score ?? null,

      latestRecoveryLevel:
        latestRecovery[0]?.level ?? null,

      latestRecoveryRecommendation:
        latestRecovery[0]?.recommendation ?? null,

      latestAIRecommendation:
        latestAI[0]?.recommendation ?? null,

      latestAISource:
        latestAI[0]?.source ?? null

    });

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