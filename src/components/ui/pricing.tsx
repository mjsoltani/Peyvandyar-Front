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
    <div className="container py-20">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-slate-800">
          {title}
        </h2>
        <p className="text-slate-500 text-lg whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <label className="relative inline-flex items-center cursor-pointer gap-3">
          <span className={cn("font-semibold", isMonthly ? "text-slate-800" : "text-slate-500")}>
            ماهیانه
          </span>
          <Switch
            checked={!isMonthly}
            onCheckedChange={handleToggle}
            className="relative"
          />
          <span className={cn("font-semibold", !isMonthly ? "text-slate-800" : "text-slate-500")}>
            سالیانه <span className="text-orange-500">(۲۰% تخفیف)</span>
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              "rounded-2xl border p-8 bg-white text-center flex flex-col relative",
              plan.isPopular
                ? "border-orange-500 border-2 shadow-xl"
                : "border-slate-200 shadow-md"
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white py-1 px-3 rounded-bl-xl rounded-tr-xl flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold text-sm">محبوب</span>
              </div>
            )}

            <div className="flex-1 flex flex-col">
              <p className="text-base font-semibold text-slate-600 mb-4">
                {plan.name}
              </p>

              <div className="mt-6 flex items-center justify-center gap-x-2 mb-2">
                <span className="text-5xl font-bold text-slate-800">
                  {isMonthly ? plan.price : plan.yearlyPrice}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  هزار تومان
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-6">
                {isMonthly ? "ماهیانه" : "سالیانه"}
              </p>

              <ul className="mt-6 gap-3 flex flex-col mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-left text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="w-full my-6" />

              <Link
                href={plan.href}
                className={cn(
                  "w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 text-center",
                  plan.isPopular
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                )}
              >
                {plan.buttonText}
              </Link>

              <p className="mt-6 text-xs text-slate-500">{plan.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
