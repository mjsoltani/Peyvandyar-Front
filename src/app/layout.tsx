"use client";

import type { Metadata } from "next";
import localFont from "next/font/local";
import { useEffect } from "react";
import "./globals.css";

// تعریف فونت ایران‌سنس با وزن‌های مختلف
const iranSans = localFont({
  src: [
    {
      path: "../fonts/IRANSansWeb_UltraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/IRANSansWeb_Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/IRANSansWeb.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/IRANSansWeb_Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/IRANSansWeb_Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-iran-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "پیوندیار | ویرایش انبوه محصولات باسلام",
  description: "ابزار ویرایش انبوه محصولات برای فروشندگان باسلام - ویرایش بیش از ۱۵۰۰ محصول به صورت همزمان",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Initialize Clarity
    import("@microsoft/clarity").then((clarity) => {
      clarity.default("um1f6g7c32");
    });
  }, []);

  return (
    <html lang="fa" dir="rtl" className={iranSans.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
