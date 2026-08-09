import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.name) {
      return NextResponse.json(
        { status: "error", message: "Nama pasien wajib diisi." },
        { status: 400 }
      );
    }

    const patient = await query<{ id: number }>(
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
        body.diagnosis,
      ]
    );

    const patientId = patient[0].id;

    // DIHAPUS: pembuatan therapy_sessions otomatis saat registrasi.
    // Sesi terapi sekarang HANYA dibuat saat terapis menekan tombol
    // "Start Therapy" secara eksplisit (lewat POST /api/sessions),
    // supaya waktu mulai sesi mencerminkan waktu terapi sungguhan,
    // bukan waktu pasien didaftarkan.

    return NextResponse.json({
      status: "ok",
      patientId,
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
