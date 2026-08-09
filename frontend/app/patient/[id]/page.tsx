import Link from "next/link";
import { query } from "@/lib/db";

async function getPatient(id: string) {
  const patientRows = await query<{
    id: number;
    full_name: string;
    age: number;
    gender: string;
    diagnosis: string;
  }>(
    `SELECT id, full_name, age, gender, diagnosis FROM patients WHERE id = $1`,
    [id]
  );

  if (patientRows.length === 0) {
    return null;
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
    [id]
  );

  return { patient: patientRows[0], sessions: sessionRows };
}

export default async function PatientPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getPatient(params.id);

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Pasien tidak ditemukan</h1>
        <Link href="/" className="mt-4 inline-block text-blue-500 hover:underline">
          ← Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Detail Pasien</h1>

      <div className="flex gap-3 mb-6">
        <Link href="/" className="rounded-lg border px-4 py-2">
          ← Dashboard Monitoring
        </Link>
        <a
          href={`/api/report/${params.id}`}
          className="rounded-lg bg-green-600 px-4 py-2 text-white"
        >
          Download Report PDF
        </a>
      </div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-bold mb-2">Informasi Pasien</h2>
        <p>Nama: {data.patient.full_name}</p>
        <p>Diagnosis: {data.patient.diagnosis}</p>
        <p>Usia: {data.patient.age}</p>
        <p>Gender: {data.patient.gender}</p>
      </div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-bold mb-2">
          Riwayat Sesi ({data.sessions.length})
        </h2>
        {data.sessions.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada sesi terapi.</p>
        ) : (
          <ul className="divide-y">
            {data.sessions.map((s) => (
              <li key={s.id} className="py-2 text-sm">
                <p>
                  Sesi #{s.id} — Stage {s.stage} —{" "}
                  {new Date(s.start_time).toLocaleString("id-ID")}
                </p>
                <p className="text-gray-500">
                  {s.end_time ? "Selesai" : "Masih berjalan"} · {s.notes}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
