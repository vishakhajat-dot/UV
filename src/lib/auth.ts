import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "mla_admin_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "insecure-dev-secret");

export async function createAdminSession(username: string) {
  const token = await new SignJWT({ role: "admin", username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  return token;
}

export async function verifyAdminSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyAdminCredentials(username: string, password: string) {
  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD &&
    !!username &&
    !!password
  );
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
