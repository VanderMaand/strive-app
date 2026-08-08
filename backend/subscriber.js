require("dotenv").config();

const mqtt = require("mqtt");
const db = require("./db");

console.log("MQTT HOST =", process.env.MQTT_HOST);

const client = mqtt.connect(process.env.MQTT_HOST);

client.on("connect", () => {

  console.log("MQTT Connected");

  client.subscribe(
    "strive/patient001",
    (err) => {
      if(err){
        console.log("Subscribe Error:", err);
      } else {
        console.log("Subscribed to strive/patient001");
      }
    }
  );

});

client.on("error", (err) => {
  console.log("MQTT ERROR:", err.message);
});

client.on("message", async (topic, message) => {

  console.log("TOPIC:", topic);
  console.log("RAW:", message.toString());

  try {

    const data = JSON.parse(
      message.toString()
    );

    console.log("DATA:", data);

    const session = await db.query(`
      SELECT id
      FROM therapy_sessions
      WHERE end_time IS NULL
      ORDER BY id DESC
      LIMIT 1
    `);

    if (session.rows.length === 0) {
      console.log("Tidak ada sesi terapi aktif, data sensor diabaikan.");
      return;
    }

    const sessionId = session.rows[0].id;

    await db.query(
      `
      INSERT INTO sensor_data
      (session_id, ecg, finger_angle, elbow_angle)
      VALUES ($1, $2, $3, $4)
      `,
      [sessionId, data.ecg, data.finger_angle, data.elbow_angle]
    );

    console.log("Saved To PostgreSQL");
  } catch (error) {
    console.log("ERROR:");
    console.log(error);
  }
});