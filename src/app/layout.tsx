import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProjectStoreProvider } from "@/lib/projects/store";
import { AppShell } from "@/components/app/app-shell";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zyntera Operations",
  description: "Premium internal operations system for Zyntera Digital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ProjectStoreProvider>
          <AppShell>{children}</AppShell>
        </ProjectStoreProvider>
      </body>
    </html>
  );
}
