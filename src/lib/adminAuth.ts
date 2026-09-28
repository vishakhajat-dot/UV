import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/auth";

// Returns a 401 response when the caller is not a signed-in admin, otherwise null.
export async function requireAdmin(req: NextRequest) {
  const session = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  return session ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
