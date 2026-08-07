import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "strive_db",
  user: "postgres",
  password: "PointBreak", 
});

export async function GET() {

  const result = await pool.query(`
    SELECT *
    FROM sensor_data
    ORDER BY created_at DESC
    LIMIT 20
  `);

  return NextResponse.json(
    result.rows
  );

}