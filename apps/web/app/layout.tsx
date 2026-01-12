import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM - Lead Management System",
  description: "Hệ thống quản lý khách hàng tiềm năng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
