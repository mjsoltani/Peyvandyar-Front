import type { Metadata } from "next";
import "./globals.css";

// استفاده از system font برای جلوگیری از مشکل در build time
// در صورت نیاز می‌توانید فونت Vazirmatn را از Google Fonts استفاده کنید
// اما برای build در Docker، از system font استفاده می‌کنیم

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
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
