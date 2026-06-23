import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CategoriesDashboard } from "@/components/categories/categories-dashboard";
import { hasValidSession } from "@/lib/auth";
export const metadata: Metadata = { title: "Categorías | Abarrotes" };
export default async function Page(){if(!(await hasValidSession()))redirect("/login");return <CategoriesDashboard/>}
