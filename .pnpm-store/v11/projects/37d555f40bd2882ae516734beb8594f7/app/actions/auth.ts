"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_TOKEN_COOKIE,
  createSessionToken,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE,
  type SessionUser,
} from "@/lib/auth";
import { BACKEND_API_URL, extractRefreshToken } from "@/lib/backend";

const EIGHT_HOURS = 60 * 60 * 8;
const FIFTEEN_MINUTES = 60 * 15;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export type LoginState = {
  error: string | null;
  fieldErrors: {
    email?: string;
    password?: string;
  };
};

type LoginResponse = {
  accessToken: string;
  user: SessionUser;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  const fieldErrors: LoginState["fieldErrors"] = {};

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    fieldErrors.email = "Ingresa un correo electrónico válido.";
  }

  if (password.length < 6) {
    fieldErrors.password = "La contraseña debe tener al menos 6 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return {
      error: "No fue posible conectar con el servidor. Intenta nuevamente.",
      fieldErrors: {},
    };
  }

  if (!response.ok) {
    return {
      error: response.status === 401
        ? "El correo o la contraseña no coinciden."
        : "No fue posible iniciar sesión.",
      fieldErrors: {},
    };
  }

  const result = await response.json() as LoginResponse;
  const refreshToken = extractRefreshToken(response.headers.get("set-cookie"));
  if (!refreshToken) {
    return { error: "El servidor no pudo crear la sesión.", fieldErrors: {} };
  }

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const sessionDuration = remember ? THIRTY_DAYS : EIGHT_HOURS;
  const common = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };

  cookieStore.set(ACCESS_TOKEN_COOKIE, result.accessToken, {
    ...common,
    maxAge: FIFTEEN_MINUTES,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...common,
    maxAge: remember ? THIRTY_DAYS : undefined,
  });
  cookieStore.set(SESSION_COOKIE, createSessionToken(result.user, sessionDuration), {
    ...common,
    maxAge: remember ? sessionDuration : undefined,
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    try {
      await fetch(`${BACKEND_API_URL}/auth/logout`, {
        method: "POST",
        headers: { Cookie: `refreshToken=${encodeURIComponent(refreshToken)}` },
        cache: "no-store",
      });
    } catch {
      // La sesión local debe cerrarse aunque la API no esté disponible.
    }
  }

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
