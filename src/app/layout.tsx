import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/shared/providers";

const sans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SAAS - 家纺 AI 摄影与电商设计工作台",
  description: "云端驱动的家纺 AI 摄影与电商设计工作台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={sans.variable}>
      <body className={`${sans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
