import "./globals.css";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { getOrdoUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const metadata = {
  title: "Ordo",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getOrdoUser();

  // Check isActive — skip on public routes so we don't redirect-loop
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? "";
  const isPublic = pathname === "/suspended" || pathname === "/login" || pathname.startsWith("/auth");

  if (user && !user.isActive && !isPublic) {
    redirect("/suspended");
  }

  return (
    <html lang="en">
      <body>
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}
