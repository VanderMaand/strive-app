import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));

  console.log("=== DEBUG LOGIN ===");
  console.log("email diterima:", JSON.stringify(email));
  console.log("password diterima:", JSON.stringify(password));

  if (!email || !password) {
    console.log("Gagal: email/password kosong");
    console.log("===================");
    return NextResponse.json(
      { status: "error", message: "Email dan password wajib diisi." },
      { status: 400 }
    );
  }

  const rows = await query<{
    id: number;
    email: string;
    password_hash: string;
    role: string;
  }>(`SELECT id, email, password_hash, role FROM users WHERE email = $1`, [
    email,
  ]);

  console.log("jumlah user ditemukan:", rows.length);
  console.log("user data:", rows[0] ?? null);
  console.log("password_hash di DB:", rows[0]?.password_hash);
  console.log("panjang hash:", rows[0]?.password_hash?.length);

  const user = rows[0];

  if (!user) {
    console.log("Gagal: email tidak ditemukan di database");
    console.log("===================");
    return NextResponse.json(
      { status: "error", message: "Email atau password salah." },
      { status: 401 }
    );
  }

  const passwordMatch = await verifyPassword(password, user.password_hash);
  console.log("password cocok?:", passwordMatch);
  console.log("===================");

  if (!passwordMatch) {
    return NextResponse.json(
      { status: "error", message: "Email atau password salah." },
      { status: 401 }
    );
  }

  const token = await signToken({ id: user.id, email: user.email, role: user.role });

  const res = NextResponse.json({ status: "ok" });
  res.cookies.set("strive_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 jam
    path: "/",
  });
  return res;
}