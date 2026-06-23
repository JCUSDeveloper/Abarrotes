import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UsersDashboard } from "@/components/users/users-dashboard";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Usuarios | Abarrotes" };

export default async function UsersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  return <UsersDashboard currentUserId={user.id} />;
}
