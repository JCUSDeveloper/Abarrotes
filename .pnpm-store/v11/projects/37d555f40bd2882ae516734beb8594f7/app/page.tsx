import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard/dashboard";
import { hasValidSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard | Abarrotes",
  description: "Resumen operativo del catálogo de Abarrotes.",
};

export default async function Home() {
  if (!(await hasValidSession())) redirect("/login");
  return <Dashboard />;
}
