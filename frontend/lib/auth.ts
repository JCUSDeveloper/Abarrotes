import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "abarrotes_session";
export const ACCESS_TOKEN_COOKIE = "abarrotes_access_token";
export const REFRESH_TOKEN_COOKIE = "abarrotes_refresh_token";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  storeId: string | null;
};

type SessionPayload = SessionUser & { expiresAt: number };

const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "abarrotes-development-secret-change-me";

function sign(payload: string) {
  return createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser, durationInSeconds: number) {
  const payload = Buffer.from(JSON.stringify({
    ...user,
    expiresAt: Date.now() + durationInSeconds * 1000,
  } satisfies SessionPayload)).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string): SessionUser | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(receivedBuffer, expectedBuffer)) return null;

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (session.expiresAt <= Date.now()) return null;
    return {
      id: session.id,
      email: session.email,
      firstName: session.firstName,
      lastName: session.lastName,
      role: session.role,
      storeId: session.storeId,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function hasValidSession() {
  return Boolean(await getSessionUser());
}
