import { Pool } from "pg";
import { patients } from "../db/seed-data";

// Skrip ini HANYA dijalankan manual oleh developer (npm run seed), untuk
// mengisi data uji ke PostgreSQL saat belum ada sensor sungguhan yang
// mengirim data. Aplikasi Next.js sendiri tidak pernah memanggil skrip ini
// atau data di db/seed-data.ts secara otomatis.
//
// Pemakaian:
//   DATABASE_URL=postgresql://user:pass@localhost:5432/strive npm run seed

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL belum diset. Contoh:");
    console.error("  DATABASE_URL=postgresql://user:pass@localhost:5432/strive npm run seed");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  for (const p of patients) {
    await pool.query(
      `insert into patients (id, name, diagnosis) values ($1, $2, $3)
       on conflict (id) do update set name = excluded.name, diagnosis = excluded.diagnosis`,
      [p.id, p.name, p.diagnosis]
    );

    for (const s of p.sessions) {
      await pool.query(
        `insert into therapy_sessions
           (patient_id, started_at, duration_min, finger_movement_pct, elbow_movement_pct, consistency_pct)
         values ($1, $2, $3, $4, $5, $6)`,
        [p.id, s.date, s.durationMin, s.fingerMovement, s.elbowMovement, s.consistency]
      );
    }

    console.log(`Seeded ${p.name} (${p.sessions.length} sesi)`);
  }

  console.log("Catatan: tabel vitals_log sengaja TIDAK diisi di sini --");
  console.log("data real-time (ECG, sudut jari, sudut siku) harus datang");
  console.log("dari aplikasi akuisisi sensor lewat POST /api/vitals.");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
