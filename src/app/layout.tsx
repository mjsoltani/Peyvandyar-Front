import type { Metadata } from "next";
import localFont from "next/font/local";
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
  return (
    <html lang="fa" dir="rtl" className={iranSans.variable}>
      <head>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "um1f6g7c32");
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
