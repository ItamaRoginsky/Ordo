import { redirect } from "next/navigation";
import { getOrdoUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getOrdoUser();
  if (!user?.isAdmin) redirect("/boards");

  return <>{children}</>;
}
