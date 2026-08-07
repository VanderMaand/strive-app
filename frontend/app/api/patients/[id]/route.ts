import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: Request,
  {
    params
  }: {
    params: {
      id: string;
    };
  }
) {

  try {

    const patientId =
      params.id;

    const patient =
      await query(
        `
        SELECT *
        FROM patients
        WHERE id = $1
        `,
        [patientId]
      );

    const sessions =
      await query(
        `
        SELECT *
        FROM therapy_sessions
        WHERE patient_id = $1
        ORDER BY id DESC
        `,
        [patientId]
      );

    const recovery =
      await query(
        `
        SELECT
          r.*
        FROM recovery_scores r
        JOIN therapy_sessions t
        ON t.id = r.session_id
        WHERE t.patient_id = $1
        ORDER BY r.id DESC
        `,
        [patientId]
      );

    const ai =
      await query(
        `
        SELECT *
        FROM ai_recommendations
        WHERE patient_id = $1
        ORDER BY id DESC
        `,
        [patientId]
      );

    return NextResponse.json({

      patient:
        patient[0] ?? null,

      sessions,

      recovery,

      ai

    });

  } catch (error) {

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