import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, verifyToken } from "@/lib/auth";

// debug saja
export async function POST(req: NextRequest) {
  const token = req.cookies.get("strive_token")?.value;
  const currentUser = token ? verifyToken(token) : null;

  console.log("=== DEBUG /api/users ===");
  console.log("token ada?:", Boolean(token));
  console.log("token value:", token);
  console.log("currentUser:", currentUser);
  console.log("========================");

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json(
      { status: "error", message: "Hanya admin yang bisa menambah user." },
      { status: 403 }
    );
  }
  // debug

  const { fullName, email, password, role } = await req.json().catch(() => ({}));

  if (!fullName || !email || !password) {
    return NextResponse.json(
      { status: "error", message: "Nama, email, dan password wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    const rows = await query<{ id: number }>(
      `
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [fullName, email, passwordHash, role ?? "therapist"]
    );

    return NextResponse.json({ status: "ok", userId: rows[0].id });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}