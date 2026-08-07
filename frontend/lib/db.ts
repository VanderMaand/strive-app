import { Pool } from "pg";

let pool: Pool | null = null;

export function isDbConfigured(): boolean {

  console.log(
    "DATABASE_URL =",
    process.env.DATABASE_URL
  );

  return Boolean(
    process.env.DATABASE_URL
  );

}

export function getPool(): Pool | null {

  if (!isDbConfigured()) {
    console.log(
      "DATABASE_URL tidak ditemukan!"
    );
    return null;
  }

  if (!pool) {

    console.log(
      "Membuat koneksi PostgreSQL..."
    );

    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL,
    });

    pool.on(
      "connect",
      () => {
        console.log(
          "PostgreSQL Connected"
        );
      }
    );

    pool.on(
      "error",
      (err) => {
        console.error(
          "PostgreSQL Error:",
          err
        );
      }
    );

  }

  return pool;

}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {

  const p = getPool();

  if (!p) {

    throw new Error(
      "DATABASE_URL belum dikonfigurasi."
    );

  }

  try {

    const result =
      await p.query(
        text,
        params
      );

    return result.rows as T[];

  }
  catch(error)
  {

    console.error(
      "SQL Query Error:"
    );

    console.error(
      error
    );

    throw error;

  }

}