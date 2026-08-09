import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("strive_token")?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    return NextResponse.json({ status: "unauthenticated" }, { status: 401 });
  }

  return NextResponse.json({ status: "ok", user });
}
