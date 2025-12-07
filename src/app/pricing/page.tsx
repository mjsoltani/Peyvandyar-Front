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
    href: "https://basalam.com/choonehbread",
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
    href: "https://basalam.com/choonehbread",
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
    href: "https://basalam.com/choonehbread",
    isPopular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg sm:text-xl text-slate-800">
            پیوندیار
          </Link>
          <Link
            href="https://basalam.com/choonehbread"
            className="flex items-center gap-1 sm:gap-2 text-orange-500 hover:text-orange-600 font-semibold text-xs sm:text-sm"
          >
            بازگشت به فروشگاه
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-8 sm:mb-12 text-center">
            سوالات متداول
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-sm sm:text-base text-slate-800">
                آیا می‌توانم پلن را تغییر دهم؟
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                بله، می‌توانید هر زمان پلن خود را ارتقا یا کاهش دهید. تغییرات فوری اعمال می‌شود.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-sm sm:text-base text-slate-800">
                آیا تست رایگان نیاز به کارت اعتباری دارد؟
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                خیر، تست رایگان ۷ روزه بدون نیاز به کارت اعتباری است.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-sm sm:text-base text-slate-800">
                آیا می‌توانم هر زمان لغو کنم؟
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                بله، می‌توانید هر زمان اشتراک خود را لغو کنید. هیچ هزینه اضافی نخواهید داشت.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-sm sm:text-base text-slate-800">
                آیا تخفیف سالیانه وجود دارد؟
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                بله، با انتخاب پلن سالیانه ۲۰% تخفیف دریافت کنید.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-orange-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">
            آماده شروع هستید؟
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            امروز شروع کنید و ۷ روز رایگان تست کنید. هیچ کارت اعتباری لازم نیست.
          </p>
          <Link
            href="https://basalam.com/choonehbread"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm sm:text-base active:scale-95"
          >
            شروع تست رایگان
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
