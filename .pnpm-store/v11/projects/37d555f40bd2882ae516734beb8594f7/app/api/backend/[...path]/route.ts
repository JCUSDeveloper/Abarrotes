import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth";
import { BACKEND_API_URL, extractRefreshToken } from "@/lib/backend";

const ALLOWED_RESOURCES = new Set([
  "categories",
  "dashboard",
  "health",
  "inventory",
  "products",
  "suppliers",
  "users",
]);

type RouteContext = { params: Promise<{ path: string[] }> };
type RefreshedSession = { accessToken: string; refreshToken: string };

async function refreshSession(refreshToken: string): Promise<RefreshedSession | null> {
  const response = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: `refreshToken=${encodeURIComponent(refreshToken)}` },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const body = await response.json() as { accessToken: string };
  const rotatedRefreshToken = extractRefreshToken(response.headers.get("set-cookie"));
  if (!rotatedRefreshToken) return null;

  return { accessToken: body.accessToken, refreshToken: rotatedRefreshToken };
}

async function forward(
  request: NextRequest,
  targetUrl: string,
  accessToken?: string,
  body?: ArrayBuffer,
) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  if (!path.length || !ALLOWED_RESOURCES.has(path[0])) {
    return NextResponse.json({ message: "Recurso no permitido" }, { status: 404 });
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const targetUrl = `${BACKEND_API_URL}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const requestBody = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  let backendResponse = await forward(request, targetUrl, accessToken, requestBody);
  let refreshed: RefreshedSession | null = null;

  if (backendResponse.status === 401 && refreshToken) {
    refreshed = await refreshSession(refreshToken);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      backendResponse = await forward(request, targetUrl, accessToken, requestBody);
    }
  }

  const body = await backendResponse.arrayBuffer();
  const response = new NextResponse(body, { status: backendResponse.status });
  const responseContentType = backendResponse.headers.get("content-type");
  if (responseContentType) response.headers.set("Content-Type", responseContentType);

  if (refreshed) {
    const secure = process.env.NODE_ENV === "production";
    const common = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
    response.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, {
      ...common,
      maxAge: 60 * 15,
    });
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, {
      ...common,
      maxAge: 60 * 60 * 24 * 30,
    });
  } else if (backendResponse.status === 401) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    response.cookies.delete(SESSION_COOKIE);
  }

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
