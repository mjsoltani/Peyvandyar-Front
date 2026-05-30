"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Zap, Package, Copy, Headphones } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Footer } from "@/components/ui/footer";
import { PaymentModal } from "@/components/ui/payment-modal";
import { Home, Zap as ZapIcon, HelpCircle, LogIn, CreditCard } from "lucide-react";
import { BASALAM_SSO_URL } from "@/lib/auth";

const navItems = [
  { name: "خانه", url: "/", icon: Home },
  { name: "امکانات", url: "/#features", icon: ZapIcon },
  { name: "راهنما", url: "/#guide", icon: HelpCircle },
  { name: "اشتراک", url: "/subscription", icon: CreditCard },
  { name: "ورود", url: BASALAM_SSO_URL, icon: LogIn },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    price: string;
    planId: "monthly" | "biweekly";
  } | null>(null);
  
  const plans = [
    {
      id: "trial",
      planId: null,
      name: "دوره آزمایشی",
      price: "رایگان",
      duration: "۷ روز",
      description: "برای آشنایی با پیوندیار",
      features: [
        "ویرایش انبوه محصولات",
        "مدیریت محصولات",
        "پشتیبانی محدود",
      ],
      notIncluded: [
        "کپی محصول",
        "پشتیبانی ۲۴ ساعته",
      ],
      buttonText: "شروع رایگان",
      buttonColor: "bg-slate-500 hover:bg-slate-600",
      popular: false,
      disabled: true,
      disabledText: "فقط برای کاربران جدید",
    },
    {
      id: "biweekly",
      planId: "biweekly" as const,
      name: "اشتراک دو هفته‌ای",
      price: "۲۰۰,۰۰۰",
      duration: "۱۵ روز",
      description: "برای شروع سریع",
      features: [
        "کپی محصول",
        "ویرایش انبوه محصولات",
        "مدیریت محصولات",
        "پشتیبانی استاندارد",
      ],
      notIncluded: [],
      buttonText: "خرید اشتراک دو هفته‌ای",
      buttonColor: "bg-orange-500 hover:bg-orange-600",
      popular: false,
    },
    {
      id: "monthly",
      planId: "monthly" as const,
      name: "اشتراک ماهانه",
      price: "۳۰۰,۰۰۰",
      duration: "۳۰ روز",
      description: "تمام امکانات پیوندیار",
      features: [
        "کپی محصول",
        "ویرایش انبوه محصولات",
        "مدیریت محصولات",
        "پشتیبانی ۲۴ ساعته",
      ],
      notIncluded: [],
      buttonText: "خرید اشتراک ماهانه",
      buttonColor: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
      popular: true,
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
    <main>
      <NavBar items={navItems} />
      
      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white pt-20 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              custom={0}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/[0.1] border border-orange-500/[0.2] mb-6"
            >
              <CreditCard className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-700 font-semibold">
                اشتراک
              </span>
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 tracking-tight"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-slate-800 to-slate-600">
                انتخاب اشتراک
              </span>{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
                مناسب
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
            >
              اشتراک مناسب خود را انتخاب کنید و از تمام امکانات پیوندیار بهره‌مند شوید
            </motion.p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                custom={index + 3}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className={`relative bg-white rounded-2xl border-2 p-8 ${
                  plan.popular
                    ? "border-orange-500 shadow-2xl shadow-orange-500/20"
                    : "border-slate-200 shadow-lg"
                } ${plan.disabled ? "opacity-75" : ""}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      محبوب‌ترین
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-4xl font-black text-slate-800">
                      {plan.price}
                    </span>
                    {plan.price !== "رایگان" && (
                      <span className="text-slate-500 text-sm mr-2">
                        تومان / {plan.duration}
                      </span>
                    )}
                    {plan.price === "رایگان" && (
                      <span className="text-slate-500 text-sm mr-2">
                        {plan.duration}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                        <X className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-slate-400 text-sm line-through">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <div className="text-center">
                  {plan.disabled ? (
                    <div>
                      <button
                        disabled
                        className="w-full px-6 py-3 bg-slate-200 text-slate-400 rounded-xl font-bold cursor-not-allowed"
                      >
                        {plan.buttonText}
                      </button>
                      <p className="text-xs text-slate-500 mt-2">
                        {plan.disabledText}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedPlan({
                        name: plan.name,
                        price: plan.price,
                        planId: plan.planId!
                      })}
                      className={`w-full px-6 py-3 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-lg ${plan.buttonColor}`}
                    >
                      {plan.buttonText}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            custom={6}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-20 text-center"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              سوالی دارید؟
            </h2>
            <p className="text-slate-600 mb-6">
              برای اطلاعات بیشتر و پشتیبانی با ما تماس بگیرید
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://t.me/mjsoltani2001"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 justify-center"
              >
                <span>تلگرام</span>
              </a>
              <a
                href="tel:09162628099"
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 justify-center"
              >
                <span>تماس تلفنی</span>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={selectedPlan !== null}
        onClose={() => setSelectedPlan(null)}
        planName={selectedPlan?.name || ""}
        price={selectedPlan?.price || ""}
        planId={selectedPlan?.planId || "monthly"}
      />

      <Footer />
    </main>
  );
}