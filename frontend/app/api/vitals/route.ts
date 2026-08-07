import { NextRequest, NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

/*
GET /api/vitals?session=<id>

Membaca data sensor terbaru dari tabel sensor_data
yang dikirim oleh:

ESP32
 ↓
MQTT
 ↓
subscriber.js
 ↓
PostgreSQL

Dashboard hanya membaca data.
*/

export async function GET(req: NextRequest) {

  const encoder = new TextEncoder();

  const sessionId =
    req.nextUrl.searchParams.get("session");

  if (!sessionId) {

    return NextResponse.json(
      {
        status: "error",
        message:
          "Query 'session' wajib diisi."
      },
      {
        status: 400
      }
    );

  }

  const stream = new ReadableStream({

    start(controller) {

      const send = (payload: unknown) => {

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify(payload)}\n\n`
          )
        );

      };

      if (!isDbConfigured()) {

        send({
          status: "disconnected"
        });

        const hb =
          setInterval(
            () =>
              send({
                status: "disconnected"
              }),
            5000
          );

        req.signal.addEventListener(
          "abort",
          () => {

            clearInterval(hb);

            controller.close();

          }
        );

        return;

      }

      let lastCreatedAt:
        string | null = null;

      const interval =
        setInterval(
          async () => {

            try {

              const rows =
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

              if (
                rows.length === 0
              ) {

                send({
                  status: "waiting"
                });

                return;

              }

              const latest =
                rows[0];

              if (
                latest.created_at ===
                lastCreatedAt
              ) {
                return;
              }

              lastCreatedAt =
                latest.created_at;

              send({

                status: "ok",

                ecg:
                  latest.ecg,

                finger_angle:
                  latest.finger_angle,

                elbow_angle:
                  latest.elbow_angle,

                created_at:
                  latest.created_at

              });

            }
            catch(error)
            {

              send({

                status: "error",

                message:
                  (error as Error)
                    .message

              });

            }

          },
          1000
        );

      req.signal.addEventListener(
        "abort",
        () => {

          clearInterval(
            interval
          );

          controller.close();

        }
      );

    }

  });

  return new Response(
    stream,
    {

      headers: {

        "Content-Type":
          "text/event-stream",

        "Cache-Control":
          "no-cache",

        Connection:
          "keep-alive"

      }

    }
  );

}

/*
POST /api/vitals

Opsional.

Untuk testing dashboard tanpa ESP32.
Jika produksi:
lebih baik pakai MQTT → subscriber.js
langsung ke PostgreSQL.
*/

export async function POST(
  req: NextRequest
) {

  if (!isDbConfigured()) {

    return NextResponse.json(
      {
        status:
          "disconnected",

        message:
          "DATABASE_URL belum diisi."
      },
      {
        status: 503
      }
    );

  }

  const body =
    await req
      .json()
      .catch(
        () => null
      );

  if (
    !body?.sessionId
  ) {

    return NextResponse.json(
      {

        status:
          "error",

        message:
          "Field sessionId wajib diisi."

      },
      {
        status: 400
      }
    );

  }

  try {

    await query(

      `
      INSERT INTO sensor_data
      (
        session_id,
        ecg,
        finger_angle,
        elbow_angle
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

        body.ecg ?? null,

        body.fingerAngle ?? null,

        body.elbowAngle ?? null

      ]

    );

    return NextResponse.json(
      {
        status: "ok"
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

        status:
          "error",

        message:
          (error as Error)
            .message

      },
      {
        status: 500
      }
    );

  }

}