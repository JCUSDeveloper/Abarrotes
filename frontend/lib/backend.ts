import "server-only";

export const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:4000/api/v1";

export function extractRefreshToken(setCookieHeader: string | null) {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/(?:^|,\s*)refreshToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
