"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FeatureModal } from "./feature-modal";
import {
  Package,
  Edit2,
  Copy,
  TrendingUp,
  CheckCircle,
  Zap,
} from "lucide-react";

export function DashboardPreview() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const features = [
    {
      id: "products",
      icon: <Package className="w-5 h-5" />,
      title: "مدیریت محصولات",
      description: "مشاهده و مدیریت تمام محصولات فروشگاه",
      details: "در این قسمت می‌توانید تمام محصولات خود را مشاهده کنید. می‌توانید محصولات را جستجو کنید، فیلتر کنید و اطلاعات آن‌ها را مشاهده کنید. همچنین می‌توانید محصولات را انتخاب کنید و به صورت دسته‌ای ویرایش کنید.",
    },
    {
      id: "bulk-edit",
      icon: <Edit2 className="w-5 h-5" />,
      title: "ویرایش انبوه",
      description: "ویرایش بیش از ۱۵۰۰ محصول به صورت همزمان",
      details: "این قسمت برای ویرایش دسته‌ای محصولات است. می‌توانید قیمت، موجودی، توضیحات و سایر اطلاعات را برای چندین محصول به صورت همزمان تغییر دهید. این ویژگی باعث می‌شود که کار شما بسیار سریع‌تر انجام شود.",
    },
    {
      id: "copy",
      icon: <Copy className="w-5 h-5" />,
      title: "کپی محصول",
      description: "کپی محصولات از فروشگاه‌های دیگر",
      details: "می‌توانید محصولات را از فروشگاه‌های دیگری که شما دسترسی ندارید کپی کنید. فقط لینک محصول را وارد کنید و پیوندیار تمام اطلاعات را کپی می‌کند. این ویژگی برای شروع سریع با محصولات جدید بسیار مفید است.",
    },
    {
      id: "reports",
      icon: <TrendingUp className="w-5 h-5" />,
      title: "آمار و گزارش",
      description: "مشاهده آمار تغییرات و عملیات انجام شده",
      details: "گزارش‌های تفصیلی از تمام عملیات انجام شده را مشاهده کنید. می‌توانید ببینید چند محصول تغییر کرده‌اند، چه تغییراتی اعمال شده‌اند و کی اعمال شده‌اند. این اطلاعات برای پیگیری و تحلیل بسیار مفید است.",
    },
  ];

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.2 + i * 0.15,
        ease: "easeOut" as const,
      },
    }),
  };

  return (
    <section dir="rtl" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/[0.1] border border-orange-500/[0.2] mb-6"
          >
            <span className="text-sm text-orange-700 font-semibold">
              داشبورد
            </span>
          </motion.div>

          <motion.h2
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-slate-800 to-slate-600">
              داشبورد قدرتمند
            </span>{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
              برای مدیریت
            </span>
          </motion.h2>

          <motion.p
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            رابط کاربری ساده و قدرتمند برای مدیریت کامل محصولات باسلام
          </motion.p>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          custom={3}
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-12"
        >
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-orange-500/10 bg-gradient-to-b from-slate-50 to-white">
            {/* Mock Dashboard */}
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">داشبورد</h3>
                  <p className="text-sm text-slate-500">خوش آمدید به پیوندیار</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                  ش
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "کل محصولات", value: "۱۵۲۳", icon: "📦" },
                  { label: "محصولات فعال", value: "۱۴۸۹", icon: "✅" },
                  { label: "موجود در انبار", value: "۱۲۳۴", icon: "📊" },
                  { label: "تغییرات امروز", value: "۴۲", icon: "⚡" },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className="text-xs text-slate-500">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "ویرایش انبوه", icon: "✏️", color: "from-orange-50 to-orange-100" },
                  { label: "کپی محصول", icon: "📋", color: "from-blue-50 to-blue-100" },
                  { label: "مدیریت محصولات", icon: "📦", color: "from-green-50 to-green-100" },
                  { label: "گزارش‌ها", icon: "📈", color: "from-purple-50 to-purple-100" },
                ].map((action, idx) => (
                  <div key={idx} className={`bg-gradient-to-br ${action.color} rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{action.icon}</span>
                      <span className="font-semibold text-slate-700">{action.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              custom={index + 4}
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              onClick={() => setSelectedFeature(feature.id)}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-orange-200 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600">
                {feature.description}
              </p>
            </motion.div>
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
      </div>
    </section>
  );
}
