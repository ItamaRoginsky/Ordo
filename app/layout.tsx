import "./globals.css";
import { Inter } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { getOrdoUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Ordo",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getOrdoUser();

  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? "";
  const isPublic = pathname === "/suspended" || pathname === "/login" || pathname.startsWith("/auth");

  if (user && !user.isActive && !isPublic) {
    redirect("/suspended");
  }

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ordo-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body>
        <Auth0Provider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
