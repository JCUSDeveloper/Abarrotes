import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/auth/login-screen";
import { hasValidSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión | Abarrotes",
  description: "Acceso al sistema de inventario de Abarrotes.",
};

export default async function LoginPage() {
  if (await hasValidSession()) redirect("/");
  return <LoginScreen />;
}
