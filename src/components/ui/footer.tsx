"use client";

import Link from "next/link";
import { BASALAM_SSO_URL } from "@/lib/auth";

// لوگوی پیوندیار
const PeyvandyarLogo = () => (
  <svg
    viewBox="0 0 120 80"
    className="w-12 h-8"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="footerChain1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff5722" />
        <stop offset="100%" stopColor="#ff7043" />
      </linearGradient>
      <linearGradient id="footerChain2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff7043" />
        <stop offset="100%" stopColor="#ff5722" />
      </linearGradient>
    </defs>
    <ellipse
      cx="38"
      cy="40"
      rx="22"
      ry="14"
      fill="none"
      stroke="url(#footerChain1)"
      strokeWidth="10"
      strokeLinecap="round"
      transform="rotate(-35 38 40)"
    />
    <ellipse
      cx="82"
      cy="40"
      rx="22"
      ry="14"
      fill="none"
      stroke="url(#footerChain2)"
      strokeWidth="10"
      strokeLinecap="round"
      transform="rotate(35 82 40)"
    />
  </svg>
);

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  // تبدیل سال میلادی به شمسی (تقریبی)
  const persianYear = currentYear - 621;

  return (
    <footer dir="rtl" className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <PeyvandyarLogo />
              <span className="font-bold text-xl">پیوندیار</span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-md">
              ابزار ویرایش انبوه محصولات برای فروشندگان باسلام. 
              با پیوندیار می‌تونید بیش از ۱۵۰۰ محصول رو به صورت همزمان ویرایش کنید.
            </p>
            <a
              href={BASALAM_SSO_URL}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              شروع رایگان
              <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">دسترسی سریع</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-slate-400 hover:text-orange-400 transition-colors">
                  خانه
                </Link>
              </li>
              <li>
                <Link href="#features" className="text-slate-400 hover:text-orange-400 transition-colors">
                  امکانات
                </Link>
              </li>
              <li>
                <Link href="#guide" className="text-slate-400 hover:text-orange-400 transition-colors">
                  راهنما
                </Link>
              </li>
              <li>
                <a href={BASALAM_SSO_URL} className="text-slate-400 hover:text-orange-400 transition-colors">
                  ورود به حساب
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="font-bold text-lg mb-4">ارتباط با ما</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://basalam.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  باسلام
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@peyvandyar.ir" 
                  className="text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  پشتیبانی
                </a>
              </li>
              <li>
                <a 
                  href="https://t.me/peyvandyar" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  تلگرام
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © {persianYear} پیوندیار. تمامی حقوق محفوظ است.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">
                قوانین و مقررات
              </Link>
              <Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">
                حریم خصوصی
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
