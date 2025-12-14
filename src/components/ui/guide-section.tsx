"use client";

import { motion } from "framer-motion";
import {
  Copy,
  Edit3,
  Zap,
  CheckCircle,
} from "lucide-react";

export function GuideSection() {
  const steps = [
    {
      number: "۱",
      title: "ورود به سیستم",
      description: "با حساب باسلام خود وارد پیوندیار شوید",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      number: "۲",
      title: "کپی محصول",
      description: "محصولات را از فروشگاه‌های دیگر کپی کنید",
      icon: <Copy className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      number: "۳",
      title: "ویرایش انبوه",
      description: "قیمت‌ها، موجودی و اطلاعات را به صورت دسته‌ای تغییر دهید",
      icon: <Edit3 className="w-6 h-6" />,
      color: "from-orange-500 to-orange-600",
    },
    {
      number: "۴",
      title: "ذخیره و انتشار",
      description: "تغییرات به صورت خودکار در باسلام ذخیره می‌شوند",
      icon: <Zap className="w-6 h-6" />,
      color: "from-green-500 to-green-600",
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
    <section dir="rtl" className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
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
              راهنما
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
              چگونه شروع کنیم؟
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
            پیوندیار را در ۴ مرحله ساده شروع کنید و محصولات خود را بهتر مدیریت کنید
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              custom={index + 3}
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 -right-6 w-12 h-0.5 bg-gradient-to-r from-orange-400 to-transparent" />
              )}

              <div className="bg-white rounded-xl border border-slate-200 p-6 h-full hover:shadow-lg hover:border-orange-200 transition-all duration-300">
                {/* Number Circle */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg mb-4`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className="text-orange-500 mb-4">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
