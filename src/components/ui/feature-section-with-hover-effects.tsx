"use client";

import { cn } from "@/lib/utils";
import {
  IconEdit,
  IconPhoto,
  IconCurrencyDollar,
  IconPackage,
  IconFileDescription,
  IconChartBar,
  IconClockHour4,
  IconShieldCheck,
} from "@tabler/icons-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "ویرایش قیمت‌ها",
      description:
        "تغییر قیمت تمام محصولات به صورت یکجا و با چند کلیک ساده",
      icon: <IconCurrencyDollar />,
    },
    {
      title: "ویرایش توضیحات",
      description:
        "بروزرسانی توضیحات محصولات بدون نیاز به ورود تک‌تک به هر محصول",
      icon: <IconFileDescription />,
    },
    {
      title: "مدیریت تصاویر",
      description:
        "آپلود و تغییر تصاویر محصولات به صورت گروهی و سریع",
      icon: <IconPhoto />,
    },
    {
      title: "مدیریت موجودی",
      description:
        "تنظیم موجودی انبار برای صدها محصول در چند ثانیه",
      icon: <IconPackage />,
    },
    {
      title: "ویرایش انبوه",
      description:
        "ویرایش بیش از ۱۵۰۰ محصول به صورت همزمان بدون محدودیت",
      icon: <IconEdit />,
    },
    {
      title: "گزارش‌گیری",
      description:
        "مشاهده آمار و گزارش تغییرات اعمال شده روی محصولات",
      icon: <IconChartBar />,
    },
    {
      title: "سرعت بالا",
      description:
        "اعمال تغییرات در کمترین زمان ممکن با پردازش موازی",
      icon: <IconClockHour4 />,
    },
    {
      title: "امنیت کامل",
      description:
        "اتصال امن به حساب باسلام با حفظ امنیت اطلاعات شما",
      icon: <IconShieldCheck />,
    },
  ];

  return (
    <section dir="rtl" className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6 mb-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/[0.1] border border-orange-500/[0.2] mb-6">
            <span className="text-sm text-orange-700 font-semibold">
              امکانات
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-slate-800 to-slate-600">
              همه چیز برای
            </span>{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
              مدیریت محصولات
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            پیوندیار تمام ابزارهای لازم برای مدیریت و ویرایش انبوه محصولات فروشگاه شما را فراهم می‌کند
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <Feature key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-l py-10 relative group/feature border-slate-200",
        (index === 0 || index === 4) && "lg:border-r border-slate-200",
        index < 4 && "lg:border-b border-slate-200"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-orange-50 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-orange-500">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute right-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tl-full rounded-bl-full bg-slate-200 group-hover/feature:bg-orange-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:-translate-x-2 transition duration-200 inline-block text-slate-800">
          {title}
        </span>
      </div>
      <p className="text-sm text-slate-500 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};

