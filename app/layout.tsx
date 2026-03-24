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
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Gelasio:wght@400..700&display=swap" rel="stylesheet" />
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
