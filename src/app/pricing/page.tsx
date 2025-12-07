"use client"

import { Pricing } from "@/components/ui/pricing"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const pricingPlans = [
  {
    name: "تست رایگان",
    price: "0",
    yearlyPrice: "0",
    period: "۷ روز",
    features: [
      "دسترسی کامل به تمام ابزارها",
      "تا ۱۰۰ محصول",
      "پشتیبانی ایمیلی",
      "بدون نیاز به کارت اعتباری",
    ],
    description: "برای شروع رایگان",
    buttonText: "شروع تست رایگان",
    href: "https://basalam.com/chooneh-bread",
    isPopular: false,
  },
  {
    name: "پلن ماهیانه",
    price: "323",
    yearlyPrice: "258",
    period: "ماه",
    features: [
      "محصولات نامحدود",
      "تحلیلات پیشرفته",
      "پشتیبانی ۲۴ ساعته",
      "دسترسی کامل API",
      "اولویت در پشتیبانی",
    ],
    description: "برای کسب‌وکارهای در حال رشد",
    buttonText: "خرید پلن ماهیانه",
    href: "https://basalam.com/chooneh-bread",
    isPopular: true,
  },
  {
    name: "پلن سالیانه",
    price: "3000",
    yearlyPrice: "3000",
    period: "سال",
    features: [
      "تمام ویژگی‌های ماهیانه",
      "راه‌حل‌های سفارشی",
      "مدیر حساب اختصاصی",
      "احراز هویت SSO",
      "امنیت پیشرفته",
      "توافق SLA",
    ],
    description: "برای سازمان‌های بزرگ",
    buttonText: "تماس برای فروش",
    href: "https://basalam.com/chooneh-bread",
    isPopular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-slate-800">
            پیوندیار
          </Link>
          <Link
            href="https://basalam.com/chooneh-bread"
            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-semibold"
          >
            بازگشت به فروشگاه
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Pricing Section */}
      <Pricing
        plans={pricingPlans}
        title="پلن‌های پیوندیار"
        description="برای شروع، یک پلن را انتخاب کنید\nتمام پلن‌ها شامل دسترسی کامل به پلتفرم و پشتیبانی اختصاصی است"
      />

      {/* FAQ Section */}
      <div className="container py-20 border-t border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800 mb-12 text-center">
          سوالات متداول
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">
              آیا می‌توانم پلن را تغییر دهم؟
            </h3>
            <p className="text-slate-600">
              بله، می‌توانید هر زمان پلن خود را ارتقا یا کاهش دهید. تغییرات فوری اعمال می‌شود.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">
              آیا تست رایگان نیاز به کارت اعتباری دارد؟
            </h3>
            <p className="text-slate-600">
              خیر، تست رایگان ۷ روزه بدون نیاز به کارت اعتباری است.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">
              آیا می‌توانم هر زمان لغو کنم؟
            </h3>
            <p className="text-slate-600">
              بله، می‌توانید هر زمان اشتراک خود را لغو کنید. هیچ هزینه اضافی نخواهید داشت.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">
              آیا تخفیف سالیانه وجود دارد؟
            </h3>
            <p className="text-slate-600">
              بله، با انتخاب پلن سالیانه ۲۰% تخفیف دریافت کنید.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-orange-50 border-t border-slate-200 py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            آماده شروع هستید؟
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            امروز شروع کنید و ۷ روز رایگان تست کنید. هیچ کارت اعتباری لازم نیست.
          </p>
          <Link
            href="https://basalam.com/chooneh-bread"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            شروع تست رایگان
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
