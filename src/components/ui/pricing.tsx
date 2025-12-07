"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Check, Star } from "lucide-react"
import Link from "next/link"
import { useState, useRef } from "react"
import confetti from "canvas-confetti"
import NumberFlow from "@number-flow/react"

interface PricingPlan {
  name: string
  price: string
  yearlyPrice: string
  period: string
  features: string[]
  description: string
  buttonText: string
  href: string
  isPopular: boolean
}

interface PricingProps {
  plans: PricingPlan[]
  title?: string
  description?: string
}

export function Pricing({
  plans,
  title = "پلن‌های پیوندیار",
  description = "پلنی را انتخاب کنید که برای شما مناسب است\nتمام پلن‌ها شامل دسترسی به پلتفرم، ابزارهای تولید سرنخ و پشتیبانی اختصاصی است.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked)
    if (checked) {
      // Confetti animation when switching to yearly
      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: 0.5,
          y: 0.3,
        },
        colors: ["#ff5722", "#ff7043", "#ff9800", "#ffc107"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      })
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-800">
            {title}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-500 whitespace-pre-line max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="flex justify-center mb-8 sm:mb-10">
          <label className="relative inline-flex items-center cursor-pointer gap-2 sm:gap-3 flex-wrap justify-center">
            <span className={cn("font-semibold text-sm sm:text-base", isMonthly ? "text-slate-800" : "text-slate-500")}>
              ماهیانه
            </span>
            <Switch
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
            />
            <span className={cn("font-semibold text-sm sm:text-base", !isMonthly ? "text-slate-800" : "text-slate-500")}>
              سالیانه <span className="text-orange-500 text-xs sm:text-sm">(۲۰% تخفیف)</span>
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
            }}
            className={cn(
              "rounded-xl sm:rounded-2xl border p-4 sm:p-6 lg:p-8 bg-white text-center flex flex-col relative transition-transform hover:scale-105",
              plan.isPopular
                ? "border-orange-500 border-2 shadow-lg sm:shadow-xl"
                : "border-slate-200 shadow-md"
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white py-1 px-2 sm:px-3 rounded-bl-lg sm:rounded-bl-xl rounded-tr-lg sm:rounded-tr-xl flex items-center gap-1">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                <span className="font-semibold text-xs sm:text-sm">محبوب</span>
              </div>
            )}

            <div className="flex-1 flex flex-col">
              <p className="text-sm sm:text-base font-semibold text-slate-600 mb-3 sm:mb-4">
                {plan.name}
              </p>

              <div className="mt-4 sm:mt-6 flex items-center justify-center gap-x-1 sm:gap-x-2 mb-1 sm:mb-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800">
                  {isMonthly ? plan.price : plan.yearlyPrice}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-500">
                  هزار تومان
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4 sm:mb-6">
                {isMonthly ? "ماهیانه" : "سالیانه"}
              </p>

              <ul className="mt-4 sm:mt-6 gap-2 sm:gap-3 flex flex-col mb-4 sm:mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 sm:gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-left text-xs sm:text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="w-full my-4 sm:my-6" />

              <Link
                href={plan.href}
                className={cn(
                  "w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-center text-sm sm:text-base",
                  plan.isPopular
                    ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-95"
                )}
              >
                {plan.buttonText}
              </Link>

              <p className="mt-4 sm:mt-6 text-xs text-slate-500">{plan.description}</p>
            </div>
          </motion.div>
        ))}
        </div>
      </div>
    </div>
  )
}
