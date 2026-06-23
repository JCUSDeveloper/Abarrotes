import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductsDashboard } from "@/components/products/products-dashboard";
import { hasValidSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Productos | Abarrotes",
  description: "Administración del catálogo y precios de productos.",
};

export default async function ProductsPage() {
  if (!(await hasValidSession())) redirect("/login");
  return <ProductsDashboard />;
}
