import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
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

  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json(
      { status: "error", message: "Email atau password salah." },
      { status: 401 }
    );
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

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