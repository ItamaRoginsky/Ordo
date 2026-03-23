import "./globals.css";
import { Inter } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { getOrdoUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className={inter.className}>
      <body>
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}
