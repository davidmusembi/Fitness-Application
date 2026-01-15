import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/auth/SessionProvider";
import { Toaster } from "@/components/ui/sonner";
import ScreenProtection from "@/components/ScreenProtection";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Deeqdarajjo - Transform Your Body & Mind",
  description: "Your complete fitness platform with personalized workouts, nutrition plans, and live coaching sessions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden max-w-full`} suppressHydrationWarning>
        <SessionProvider>
          <ScreenProtection />
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
