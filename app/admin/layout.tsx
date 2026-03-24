import { redirect } from "next/navigation";
import { getOrdoUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getOrdoUser();
  if (!user?.isAdmin) redirect("/boards");

  return <AppShell>{children}</AppShell>;
}
