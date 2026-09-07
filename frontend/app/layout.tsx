import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import AmbientBackground from "@/components/AmbientBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://corda.app'),
  title: {
    default: "Corda | Automated Task Allocation for High-Performance Teams",
    template: "%s | Corda"
  },
  description: "Corda is an intelligent task allocation and project management platform. Seamlessly distribute work, track deadlines, and sync with your tools like Moodle for maximum team productivity.",
  keywords: ["task allocation", "project management", "team productivity", "moodle sync", "automated tasks", "teamwork", "corda systems"],
  authors: [{ name: "Corda Systems", url: "https://corda.app" }],
  creator: "Corda Systems",
  publisher: "Corda Systems",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Corda | Intelligent Task Management",
    description: "Streamline your team's workflow with automated task allocation, AI-driven insights, and seamless integrations.",
    url: "https://corda.app",
    siteName: "Corda",
    images: [
      {
        url: "/og-image.jpg", // Make sure to add this image to your public folder
        width: 1200,
        height: 630,
        alt: "Corda Systems Dashboard preview",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Corda | Work Together Without Friction",
    description: "Automated task allocation for high-performance teams.",
    creator: "@cordasystems",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(getAuthOptions());

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AmbientBackground />
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
