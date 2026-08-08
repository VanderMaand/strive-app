import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("strive_token")?.value;
  const user = token ? await verifyToken(token) : null;

  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/register",
    "/users/:path*",
    "/api/patients/:path*",
    "/api/sessions/:path*",
    "/api/dashboard/:path*",
    "/api/report/:path*",
    "/api/users/:path*",
  ],
};