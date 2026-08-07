require("dotenv").config();

const db = require("./db");

async function calculateRecovery() {

  try {

    const result = await db.query(
      `
      SELECT *
      FROM sensor_data
      ORDER BY created_at DESC
      LIMIT 1
      `
    );

    if(result.rows.length === 0)
    {
      console.log("Belum ada data sensor");
      return;
    }

    const sensor =
      result.rows[0];

    const finger =
      sensor.finger_angle;

    const elbow =
      sensor.elbow_angle;

    let score = 0;
    let level = "";
    let recommendation = "";

    // LOGIKA SEMENTARA

    if(finger > 60 && elbow > 90)
    {
      score = 90;
      level = "Good";
      recommendation =
        "Pasien menunjukkan perkembangan sangat baik.";
    }
    else if(finger > 30 && elbow > 45)
    {
      score = 70;
      level = "Moderate";
      recommendation =
        "Lanjutkan terapi Stage 2.";
    }
    else
    {
      score = 40;
      level = "Poor";
      recommendation =
        "Fokus latihan ROM dasar.";
    }

    await db.query(
      `
      INSERT INTO recovery_scores
      (
        session_id,
        score,
        level,
        recommendation
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
        sensor.session_id,
        score,
        level,
        recommendation
      ]
    );

    console.log(
      "Recovery Score Saved:",
      score
    );

  }
  catch(error)
  {
    console.log(error);
  }

}

console.log(
  "Recovery Engine Loaded"
);

console.log(
  "Recovery Engine Running..."
);
