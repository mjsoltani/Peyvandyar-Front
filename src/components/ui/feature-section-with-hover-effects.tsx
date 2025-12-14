"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FeatureModal } from "./feature-modal";
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
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    {
      id: "prices",
      title: "ویرایش قیمت‌ها",
      description:
        "تغییر قیمت تمام محصولات به صورت یکجا و با چند کلیک ساده",
      details: "شما می‌توانید قیمت تمام محصولات خود را به صورت دسته‌ای تغییر دهید. می‌توانید قیمت ثابت تعیین کنید یا درصد تغییر اعمال کنید. این ویژگی برای تنظیم قیمت‌ها در مواقع تخفیف یا افزایش قیمت بسیار مفید است.",
      icon: <IconCurrencyDollar />,
    },
    {
      id: "descriptions",
      title: "ویرایش توضیحات",
      description:
        "بروزرسانی توضیحات محصولات بدون نیاز به ورود تک‌تک به هر محصول",
      details: "توضیحات محصول را برای تمام محصولات یا گروهی از محصولات به صورت همزمان ویرایش کنید. این ویژگی زمانی مفید است که می‌خواهید توضیحات را بهتر کنید یا اطلاعات جدیدی اضافه کنید.",
      icon: <IconFileDescription />,
    },
    {
      id: "images",
      title: "مدیریت تصاویر",
      description:
        "آپلود و تغییر تصاویر محصولات به صورت گروهی و سریع",
      details: "تصاویر محصولات را به صورت دسته‌ای آپلود یا تغییر دهید. می‌توانید تصاویر جدید اضافه کنید یا تصاویر موجود را جایگزین کنید. این ویژگی برای بهتر کردن ظاهر محصولات بسیار مفید است.",
      icon: <IconPhoto />,
    },
    {
      id: "inventory",
      title: "مدیریت موجودی",
      description:
        "تنظیم موجودی انبار برای صدها محصول در چند ثانیه",
      details: "موجودی انبار را برای تمام محصولات یا گروهی از محصولات تنظیم کنید. می‌توانید موجودی را افزایش یا کاهش دهید. این ویژگی برای مدیریت انبار و جلوگیری از فروش محصولات ناموجود بسیار مفید است.",
      icon: <IconPackage />,
    },
    {
      id: "bulk-edit",
      title: "ویرایش انبوه",
      description:
        "ویرایش بیش از ۱۵۰۰ محصول به صورت همزمان بدون محدودیت",
      details: "تمام ویژگی‌های ویرایش را در یک جا استفاده کنید. می‌توانید قیمت، توضیحات، تصاویر و موجودی را به صورت همزمان ویرایش کنید. این ویژگی برای مدیریت کامل محصولات بسیار قدرتمند است.",
      icon: <IconEdit />,
    },
    {
      id: "reports",
      title: "گزارش‌گیری",
      description:
        "مشاهده آمار و گزارش تغییرات اعمال شده روی محصولات",
      details: "گزارش‌های تفصیلی از تمام تغییرات اعمال شده را مشاهده کنید. می‌توانید ببینید کدام محصولات تغییر کرده‌اند و چه تغییراتی اعمال شده‌اند. این ویژگی برای پیگیری تغییرات و تحلیل عملکرد بسیار مفید است.",
      icon: <IconChartBar />,
    },
    {
      id: "speed",
      title: "سرعت بالا",
      description:
        "اعمال تغییرات در کمترین زمان ممکن با پردازش موازی",
      details: "پیوندیار از تکنولوژی‌های جدید استفاده می‌کند تا تغییرات را به سرعت اعمال کند. حتی اگر هزاران محصول داشته باشید، تغییرات در چند ثانیه اعمال می‌شوند. این سرعت باعث می‌شود که کار شما بسیار سریع‌تر انجام شود.",
      icon: <IconClockHour4 />,
    },
    {
      id: "security",
      title: "امنیت کامل",
      description:
        "اتصال امن به حساب باسلام با حفظ امنیت اطلاعات شما",
      details: "پیوندیار از رمزگذاری و پروتکل‌های امنیتی جدید استفاده می‌کند. ما هیچ دسترسی به اطلاعات مالی یا حقوقی شما نداریم. تمام ارتباطات رمزگذاری شده‌اند و اطلاعات شما کاملاً محفوظ است. ما فقط به اطلاعات محصولات دسترسی داریم.",
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
          <Feature
            key={feature.id}
            {...feature}
            index={index}
            onClick={() => setSelectedFeature(feature.id)}
          />
        ))}
      </div>

      {/* Modal */}
      {selectedFeature && (
        <FeatureModal
          isOpen={true}
          onClose={() => setSelectedFeature(null)}
          title={features.find((f) => f.id === selectedFeature)?.title || ""}
          description={
            features.find((f) => f.id === selectedFeature)?.description || ""
          }
          details={features.find((f) => f.id === selectedFeature)?.details || ""}
          icon={features.find((f) => f.id === selectedFeature)?.icon}
        />
      )}
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col lg:border-l py-10 relative group/feature border-slate-200 cursor-pointer",
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

