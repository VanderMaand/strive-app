import Link from "next/link";
async function getPatient(id: string) {
  const res = await fetch(
    `http://localhost:3000/api/patients/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Gagal mengambil data pasien");
  }

  return res.json();
}

export default async function PatientPage({
  params,
}: {
  params: { id: string };
}) {

  const data = await getPatient(params.id);

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        Detail Pasien
      </h1>

      <div className="flex gap-3 mb-6">

  <Link
    href="/"
    className="
      rounded-lg
      border
      px-4
      py-2
    "
  >
    ← Dashboard Monitoring
  </Link>

  <a
    href={`/api/report/${params.id}`}
    className="
      rounded-lg
      bg-green-600
      px-4
      py-2
      text-white
    "
  >
    Download Report PDF
  </a>

</div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-bold mb-2">
          Informasi Pasien
        </h2>

        <p>Nama: {data.patient?.full_name}</p>
        <p>Diagnosis: {data.patient?.diagnosis}</p>
        <p>Usia: {data.patient?.age}</p>
        <p>Gender: {data.patient?.gender}</p>
      </div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-bold mb-2">
          Total Sesi
        </h2>

        <p>{data.sessions.length}</p>
      </div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-bold mb-2">
          Recovery History
        </h2>

        {data.recovery.map((r: any) => (
          <div key={r.id}>
            Score: {r.score}
          </div>
        ))}
      </div>

      <div className="border rounded p-4">
        <h2 className="font-bold mb-2">
          AI Recommendation History
        </h2>

        {data.ai.map((a: any) => (
          <div
            key={a.id}
            className="mb-3 border p-3 rounded"
          >
            {a.recommendation}
          </div>
        ))}
      </div>

    </div>
  );
}