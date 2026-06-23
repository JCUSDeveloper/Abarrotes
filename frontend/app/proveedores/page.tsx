import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SuppliersDashboard } from "@/components/suppliers/suppliers-dashboard";
import { hasValidSession } from "@/lib/auth";
export const metadata: Metadata = { title: "Proveedores | Abarrotes" };
export default async function Page(){if(!(await hasValidSession()))redirect("/login");return <SuppliersDashboard/>}
