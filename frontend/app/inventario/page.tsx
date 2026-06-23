import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard";
import { hasValidSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Inventario | Abarrotes",
  description: "Panel de control de inventario para tienda de abarrotes.",
};

export default async function InventoryPage() {
  if (!(await hasValidSession())) redirect("/login");
  return <InventoryDashboard />;
}
