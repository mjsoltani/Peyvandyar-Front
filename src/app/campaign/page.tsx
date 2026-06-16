"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Vazirmatn } from "next/font/google";
import { motion } from "framer-motion";
import { getAuthToken, BASALAM_SSO_URL } from "@/lib/auth";

// فونت Vazirmatn طبق هندآف دیزاین کمپین
const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-vazir",
});

// ── Reveal: ظاهر شدن نرم هر بخش هنگام ورود به viewport ──
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const steps = [
  {
    n: "۱",
    title: "لینک محصول رو بده",
    desc: "آدرس هر محصول باسلام رو کپی و پیست کن",
  },
  {
    n: "۲",
    title: "اطلاعات رو ببین و ویرایش کن",
    desc: "قیمت، توضیحات و تصاویر رو تنظیم کن",
  },
  {
    n: "۳",
    title: "به غرفه‌ات اضافه کن",
    desc: "با یه کلیک مستقیم توی غرفه‌ی باسلامت ثبت می‌شه",
  },
];

const proFeatures = [
  "از همه چیز استفاده کنید",
  "ویرایش انبوه ۱۵۰۰+ محصول",
  "سینک بین غرفه‌ها",
  "گزارش‌گیری پیشرفته",
];

export default function CampaignLandingPage() {
  // مقصد CTA: لاگین → داشبورد، در غیر اینصورت → ورود با باسلام
  const [ctaHref, setCtaHref] = useState<string>(BASALAM_SSO_URL);

  useEffect(() => {
    // توکن فقط سمت کلاینت از کوکی خوانده می‌شود؛ محاسبه در render باعث
    // hydration mismatch می‌شود، پس عمداً بعد از mount مقداردهی می‌کنیم.
    let href: string;
    if (getAuthToken()) {
      href = "/dashboard";
    } else {
      // منبع ترافیک از لینک کمپین (مثلاً ?src=sms از پیامک). پیش‌فرض: direct
      const src =
        new URLSearchParams(window.location.search).get("src") || "direct";
      // مقدار src جایگزین state در لینک SSO باسلام می‌شود تا بعد از callback
      // به بک‌اند برسد و منبع ثبت‌نام کاربر مشخص شود.
      href = BASALAM_SSO_URL.replace(
        /([?&]state=)[^&]*/,
        `$1${encodeURIComponent(src)}`
      );
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCtaHref(href);
  }, []);

  return (
    <div
      dir="rtl"
      className={`${vazir.variable} ${vazir.className} min-h-screen bg-[#FAF8F5] text-[#1E2D40]`}
    >
      {/* صفحه موبایل‌فرست، در دسکتاپ وسط‌چین با عرض حداکثر 480px */}
      <div className="mx-auto w-full max-w-[480px] bg-[#FAF8F5] shadow-sm">
        {/* ═══════════ NAVBAR ═══════════ */}
        <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[#F0EDE8] bg-white px-5 py-3.5">
          {/* لوگو */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#F26522] text-[17px] font-black leading-none text-white">
              ∞
            </div>
            <span className="text-[15px] font-extrabold text-[#1E2D40]">پیوندیار</span>
          </div>

          {/* دکمه ورود */}
          <a
            href={ctaHref}
            className="rounded-lg bg-[#F26522] px-3.5 py-1.5 text-[12px] font-bold text-white transition-all duration-150 hover:bg-[#D9531A]"
          >
            ورود
          </a>
        </nav>

        {/* ═══════════ HERO ═══════════ */}
        <section className="relative overflow-hidden bg-[linear-gradient(175deg,#FFF6EF_0%,#FAF8F5_100%)] px-6 pb-9 pt-11 text-center">
          {/* دکوراسیون‌های دایره‌ای */}
          <div className="pointer-events-none absolute -right-[50px] -top-[50px] h-[200px] w-[200px] rounded-full bg-[#FDE8D5] opacity-50" />
          <div className="pointer-events-none absolute bottom-0 -left-[30px] h-[120px] w-[120px] rounded-full bg-[#FDE8D5] opacity-30" />

          <div className="relative z-10">
            {/* Badge */}
            <Reveal>
              <div className="mb-[18px] inline-flex items-center gap-1.5 rounded-[20px] border-[1.5px] border-[#F8D5BB] bg-[#FEF0E8] px-3.5 py-[5px]">
                <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#F26522]" />
                <span className="text-[12px] font-semibold text-[#F26522]">
                  ابزار غرفه‌داران باسلام
                </span>
              </div>
            </Reveal>

            {/* تیتر اصلی */}
            <Reveal delay={0.05}>
              <h1 className="mb-3 text-[30px] font-black leading-[1.55] text-[#1E2D40]">
                محصولاتت رو از
                <br />
                <span className="text-[#F26522]">هر غرفه‌ای</span>
                <br />
                با یک کلیک کپی کن
              </h1>
            </Reveal>

            {/* زیرتیتر */}
            <Reveal delay={0.1}>
              <p className="mb-7 text-[14px] leading-[1.85] text-[#6B7280]">
                کپی، ویرایش انبوه و مدیریت بیش از ۱۵۰۰ محصول
                <br />
                باسلام — با سرعت بالا
              </p>
            </Reveal>

            {/* دکمه CTA اصلی */}
            <Reveal delay={0.15}>
              <a href={ctaHref} className="block">
                <button className="w-full rounded-xl bg-[#F26522] px-10 py-[15px] text-[15px] font-extrabold text-white shadow-[0_6px_20px_rgba(242,101,34,0.38)] transition-all duration-150 hover:-translate-y-px hover:bg-[#D9531A] active:translate-y-0">
                  شروع رایگان ←
                </button>
              </a>
              <p className="mt-2.5 text-[11px] text-[#9CA3AF]">
                بدون نیاز به کارت بانکی · همین الان رایگان شروع کن
              </p>
            </Reveal>
          </div>
        </section>

        {/* ═══════════ STATS BAR ═══════════ */}
        <div className="flex justify-around border-b border-[#F0EDE8] bg-white px-6 py-[18px]">
          {[
            { value: "۱۰۰۰+", label: "کاربر فعال" },
            { value: "۲۰۰۰۰+", label: "کپی انجام‌شده" },
            { value: "۵۰۰٬۰۰۰+", label: "محصول مدیریت شده" },
          ].map((stat, i, arr) => (
            <div key={stat.label} className="flex items-stretch">
              <div className="text-center">
                <div className="text-[22px] font-black text-[#F26522]">{stat.value}</div>
                <div className="mt-0.5 text-[11px] text-[#9CA3AF]">{stat.label}</div>
              </div>
              {i < arr.length - 1 && <div className="mr-[clamp(8px,5vw,28px)] ml-[clamp(8px,5vw,28px)] w-px bg-[#F0EDE8]" />}
            </div>
          ))}
        </div>

        {/* ═══════════ DEMO SECTION ═══════════ */}
        <section className="bg-[#FAF8F5] px-5 py-9">
          {/* هدر بخش */}
          <Reveal>
            <div className="mb-5 text-center">
              <span className="rounded-[10px] bg-[#FEF0E8] px-3 py-1 text-[11px] font-bold text-[#F26522]">
                یکپارچه با باسلام
              </span>
              <h2 className="mt-2.5 text-[20px] font-extrabold leading-[1.5] text-[#1E2D40]">
                لینک بده، کپی بگیر
              </h2>
              <p className="mt-1.5 text-[13px] text-[#6B7280]">
                مستقیم به پنل فروشندگان باسلام وصل می‌شه
              </p>
            </div>
          </Reveal>

          {/* کارت موکاپ UI */}
          <Reveal delay={0.1}>
            <div className="rounded-[18px] bg-white p-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
              {/* Input URL */}
              <div className="mb-2.5 flex items-center gap-2 rounded-[10px] border-[1.5px] border-[#E5E2DE] bg-[#F8F7F5] px-3.5 py-[11px]">
                <div dir="ltr" className="flex-1 text-left text-[12px] text-[#9CA3AF]">
                  https://basalam.com/product/...
                </div>
                <div className="h-[18px] w-[18px] flex-shrink-0 opacity-40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
              </div>

              {/* دکمه دریافت */}
              <button className="mb-3.5 block w-full rounded-[10px] bg-[#F26522] py-[11px] text-center text-[13px] font-bold text-white transition-all duration-150 hover:bg-[#D9531A]">
                دریافت اطلاعات محصول ↓
              </button>

              {/* کارت نتیجه محصول */}
              <div className="flex gap-3 rounded-[14px] border-[1.5px] border-[#F0EDE8] bg-[#FDFCFB] p-3">
                {/* تصویر placeholder */}
                <div className="flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#FEF0E8_0%,#FDDCC4_100%)]">
                  <div className="h-[22px] w-7 rounded bg-[#F26522] opacity-25" />
                </div>

                {/* اطلاعات محصول */}
                <div className="min-w-0 flex-1">
                  <div className="mb-[7px] h-[11px] w-[85%] rounded bg-[#F0EDE8]" />
                  <div className="mb-2.5 h-[9px] w-[55%] rounded bg-[#F0EDE8]" />
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#F26522]">
                      ۴۳٬۸۰۰٬۰۰۰ تومان
                    </span>
                    <div className="rounded-md bg-[#E8F5E9] px-[9px] py-[3px] text-[10px] font-bold text-[#2E7D32]">
                      آماده کپی ✓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section className="bg-[#FAF8F5] px-5 pb-9">
          <Reveal>
            <div className="mb-5 text-center">
              <span className="rounded-[10px] bg-[#FEF0E8] px-3 py-1 text-[11px] font-bold text-[#F26522]">
                چطور کار می‌کنه؟
              </span>
              <h2 className="mt-2.5 text-[18px] font-extrabold text-[#1E2D40]">
                ۳ قدم تا مدیریت کامل
              </h2>
            </div>
          </Reveal>

          <div className="flex flex-col gap-2.5">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.08}>
                <div className="flex items-start gap-3.5 rounded-[14px] bg-white px-4 py-[15px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FEF0E8]">
                    <span className="text-[17px] font-black text-[#F26522]">{step.n}</span>
                  </div>
                  <div>
                    <h3 className="mb-[3px] text-[14px] font-bold text-[#1E2D40]">
                      {step.title}
                    </h3>
                    <p className="text-[12px] leading-[1.7] text-[#6B7280]">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══════════ PRICING ═══════════ */}
        <section className="bg-[#FAF8F5] px-5 pb-9">
          <Reveal>
            <div className="mb-5 text-center">
              <span className="rounded-[10px] bg-[#FEF0E8] px-3 py-1 text-[11px] font-bold text-[#F26522]">
                اشتراک
              </span>
              <h2 className="mt-2.5 text-[18px] font-extrabold text-[#1E2D40]">
                قیمت‌گذاری ساده
              </h2>
            </div>
          </Reveal>

          {/* کارت حرفه‌ای */}
          <Reveal delay={0.1}>
            <div className="rounded-2xl bg-[linear-gradient(135deg,#F26522_0%,#FF8A3D_100%)] p-5 shadow-[0_8px_28px_rgba(242,101,34,0.32)]">
              {/* هدر کارت */}
              <div className="mb-3.5 flex items-start justify-between">
                <div>
                  <h3 className="text-[16px] font-extrabold text-white">حرفه‌ای</h3>
                  <span className="text-[10px] text-white/70">بیشترین استفاده</span>
                </div>
                <div className="text-left">
                  <div className="text-[20px] font-black text-white">۳۰۰/۰۰۰</div>
                  <div className="text-[10px] text-white/70">تومان / ماه</div>
                </div>
              </div>

              {/* فیچرها */}
              <div className="mb-4 flex flex-col gap-2">
                {proFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-[12px] text-white/90"
                  >
                    <span className="text-[14px] font-bold">✓</span> {feature}
                  </div>
                ))}
              </div>

              {/* دکمه اشتراک */}
              <Link href="/subscription" className="block">
                <button className="w-full rounded-[10px] bg-white py-3 text-[14px] font-extrabold text-[#F26522] transition-all duration-150 hover:bg-white/90">
                  اشتراک بگیر ←
                </button>
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ═══════════ FOOTER CTA ═══════════ */}
        <section className="bg-[#1E2D40] px-6 py-9 text-center">
          <Reveal>
            <h2 className="mb-2 text-[20px] font-black text-white">همین الان شروع کن</h2>
            <p className="mb-[22px] text-[13px] text-white/50">
              رایگان — بدون نیاز به کارت بانکی
            </p>
            <a href={ctaHref}>
              <button className="rounded-xl bg-[#F26522] px-9 py-3.5 text-[15px] font-extrabold text-white shadow-[0_6px_20px_rgba(242,101,34,0.4)] transition-all duration-150 hover:-translate-y-px hover:bg-[#D9531A] active:translate-y-0">
                شروع رایگان ←
              </button>
            </a>
            <p className="mt-4 text-[11px] text-white/30">peyvand-yar.ir</p>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
