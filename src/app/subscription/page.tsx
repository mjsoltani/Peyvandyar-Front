"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, CreditCard, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Footer } from "@/components/ui/footer";
import { PaymentModal } from "@/components/ui/payment-modal";
import { Home, Zap as ZapIcon, HelpCircle, LogIn } from "lucide-react";
import { BASALAM_SSO_URL } from "@/lib/auth";
import { paymentApi, type CatalogPlan } from "@/lib/api";

const navItems = [
  { name: "خانه", url: "/", icon: Home },
  { name: "امکانات", url: "/#features", icon: ZapIcon },
  { name: "راهنما", url: "/#guide", icon: HelpCircle },
  { name: "اشتراک", url: "/subscription", icon: CreditCard },
  { name: "ورود", url: BASALAM_SSO_URL, icon: LogIn },
];

type DisplayPlan = {
  id: string;
  planId: string | null;
  name: string;
  price: string;
  duration: string;
  description: string;
  features: string[];
  notIncluded: string[];
  buttonText: string;
  buttonColor: string;
  popular: boolean;
  disabled?: boolean;
  disabledText?: string;
};

const TRIAL_PLAN: DisplayPlan = {
  id: "trial",
  planId: null,
  name: "دوره آزمایشی",
  price: "رایگان",
  duration: "۷ روز",
  description: "برای آشنایی با پیوندیار",
  features: ["ویرایش انبوه محصولات", "مدیریت محصولات", "پشتیبانی محدود"],
  notIncluded: ["کپی محصول", "پشتیبانی ۲۴ ساعته"],
  buttonText: "شروع رایگان",
  buttonColor: "bg-slate-500 hover:bg-slate-600",
  popular: false,
  disabled: true,
  disabledText: "فقط برای کاربران جدید",
};

function presentationFor(plan: CatalogPlan): Pick<
  DisplayPlan,
  "description" | "features" | "notIncluded" | "buttonColor" | "popular"
> {
  if (plan.id === "monthly") {
    return {
      description: "تمام امکانات پیوندیار",
      features: [
        "کپی محصول",
        "ویرایش انبوه محصولات",
        "مدیریت محصولات",
        "پشتیبانی ۲۴ ساعته",
      ],
      notIncluded: [],
      buttonColor:
        "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
      popular: true,
    };
  }
  if (plan.id === "biweekly") {
    return {
      description: "برای شروع سریع",
      features: [
        "کپی محصول",
        "ویرایش انبوه محصولات",
        "مدیریت محصولات",
        "پشتیبانی استاندارد",
      ],
      notIncluded: [],
      buttonColor: "bg-orange-500 hover:bg-orange-600",
      popular: false,
    };
  }
  return {
    description: "دسترسی کامل به امکانات پیوندیار",
    features: ["کپی محصول", "ویرایش انبوه محصولات", "مدیریت محصولات"],
    notIncluded: [],
    buttonColor: "bg-orange-500 hover:bg-orange-600",
    popular: false,
  };
}

function toDisplayPlan(plan: CatalogPlan): DisplayPlan {
  const extra = presentationFor(plan);
  const toman = Number(plan.amount_toman ?? (plan.amount ? plan.amount / 10 : 0));
  const days = Number(plan.duration_days) || 0;
  return {
    id: plan.id,
    planId: plan.id,
    name: plan.label || plan.id,
    price: toman.toLocaleString("fa-IR"),
    duration: `${days.toLocaleString("fa-IR")} روز`,
    buttonText: `خرید ${plan.label || "اشتراک"}`,
    ...extra,
  };
}

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    price: string;
    planId: string;
  } | null>(null);
  const [catalog, setCatalog] = useState<DisplayPlan[]>([TRIAL_PLAN]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await paymentApi.getPlans();
      const paid = (response.plans || []).map(toDisplayPlan);
      const hasPopular = paid.some((plan) => plan.popular);
      if (!hasPopular && paid.length > 0) {
        paid[paid.length - 1].popular = true;
        paid[paid.length - 1].buttonColor =
          "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700";
      }
      setCatalog([TRIAL_PLAN, ...paid]);
    } catch (err: any) {
      setError(err?.message || "خطا در دریافت پلن‌ها");
      setCatalog([TRIAL_PLAN]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

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

  const gridClass =
    catalog.length >= 3
      ? "md:grid-cols-3"
      : catalog.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-1";

  return (
    <main>
      <NavBar items={navItems} />

      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white pt-20 pb-16">
        <div className="container mx-auto px-4 md:px-6">
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

          {error && (
            <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadPlans()}
                className="text-sm text-red-700 inline-flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                تلاش مجدد
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${gridClass} gap-8 max-w-6xl mx-auto`}>
              {catalog.map((plan, index) => (
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
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                        محبوب‌ترین
                      </div>
                    </div>
                  )}

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

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-slate-700 text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                          <X className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-slate-400 text-sm line-through">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

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
                        onClick={() =>
                          setSelectedPlan({
                            name: plan.name,
                            price: plan.price,
                            planId: plan.planId!,
                          })
                        }
                        className={`w-full px-6 py-3 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-lg ${plan.buttonColor}`}
                      >
                        {plan.buttonText}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

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
                href="https://ble.ir/mjsoltani2001"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 justify-center"
              >
                <span>بله</span>
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

      <PaymentModal
        isOpen={selectedPlan !== null}
        onClose={() => setSelectedPlan(null)}
        planName={selectedPlan?.name || ""}
        price={selectedPlan?.price || ""}
        planId={selectedPlan?.planId || ""}
      />

      <Footer />
    </main>
  );
}
