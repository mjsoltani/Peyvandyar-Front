import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
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
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${vazirmatn.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
