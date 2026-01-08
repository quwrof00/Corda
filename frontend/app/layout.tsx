"use client";

import { Toaster } from "sonner";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ReactNode, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const pathname = usePathname();
  // Hide sidebar on landing page, login, register, etc.
  const isPublicPage = ["/", "/login", "/register", "/verify-email"].includes(pathname);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-background text-foreground">
        <SessionProvider>
          <QueryClientProvider client={client}>
            <div className="min-h-screen flex flex-col md:flex-row">
              {!isPublicPage && <Sidebar />}
              <main className={`flex-1 min-w-0 transition-all duration-300 ${!isPublicPage ? 'md:ml-64' : ''}`}>
                {children}
              </main>
            </div>
            <Toaster theme="dark" position="bottom-right" />
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
