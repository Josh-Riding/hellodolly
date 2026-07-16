import type { Metadata } from "next";
import { Geist, Geist_Mono, Public_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/lib/trpc/client";

const publicSans = Public_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hello Dolly",
  description: "The family recipe box.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", publicSans.variable)}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
