require("dotenv").config();
const db = require("./db");

async function generateAI() {
  try {
    // join ke therapy_sessions supaya dapat patient_id yang BENAR,
    // dan sertakan r.session_id supaya bisa dipakai saat INSERT
    const result = await db.query(`
      SELECT
        r.*,
        s.finger_angle,
        s.elbow_angle,
        t.patient_id
      FROM recovery_scores r
      JOIN sensor_data s
        ON s.session_id = r.session_id
      JOIN therapy_sessions t
        ON t.id = r.session_id
      ORDER BY r.id DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) return;

    const data = result.rows[0];

    let recommendation = "";
    if (data.score >= 80) {
      recommendation =
        "Pasien menunjukkan progres baik. Lanjutkan terapi Stage 2.";
    } else if (data.score >= 60) {
      recommendation =
        "Pasien menunjukkan progres sedang. Fokus latihan ROM siku.";
    } else {
      recommendation =
        "Pasien memerlukan latihan dasar dan pengawasan lebih lanjut.";
    }

    // pakai data.patient_id (bukan hardcode 1),
    // dan sertakan session_id supaya rekomendasi terhubung ke sesi yang benar
    await db.query(
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
        data.patient_id,
        data.session_id,
        recommendation,
        "Rule-Based AI",
      ]
    );

    console.log(
      `AI Recommendation Saved (patient_id=${data.patient_id}, session_id=${data.session_id})`
    );
  } catch (error) {
    console.log(error);
  }
}

setInterval(generateAI, 15000);

console.log("AI Engine Running...");
