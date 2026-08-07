import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(
  req: NextRequest
) {

  try {

    const body =
      await req.json();

    const patient =
      await query<{id:number}>(
        `
        INSERT INTO patients
        (
          patient_code,
          full_name,
          age,
          gender,
          diagnosis
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING id
        `,
        [
          `PAT-${Date.now()}`,
          body.name,
          body.age,
          body.gender,
          body.diagnosis
        ]
      );

    const patientId =
      patient[0].id;

    const session =
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
      1,
      'Therapy Started'
    )
    RETURNING id
    `,
    [patientId]
  );

    return NextResponse.json({

      status:"ok",

      patientId,

      sessionId:
        session[0].id

    });

  }
  catch(error)
  {

    return NextResponse.json(
      {
        status:"error",
        message:
          (error as Error).message
      },
      {
        status:500
      }
    );

  }

}