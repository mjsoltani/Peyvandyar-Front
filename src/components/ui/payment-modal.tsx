"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { paymentApi } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  planName,
  price,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // چک کردن احراز هویت
      const token = getAuthToken();
      if (!token) {
        setError("لطفا ابتدا وارد حساب کاربری خود شوید");
        return;
      }

      // تبدیل قیمت از تومان به ریال (ضرب در 10)
      const priceNumber = parseInt(price.replace(/,/g, ""));
      const amountInRial = priceNumber * 10;

      // ایجاد پیش‌تراکنش
      const response = await paymentApi.createPayment({
        amount: amountInRial,
        description: `خرید ${planName}`,
      });

      if (response.success && response.pay_url) {
        // redirect به درگاه پرداخت
        window.location.href = response.pay_url;
      } else {
        setError("خطا در ایجاد تراکنش. لطفا دوباره تلاش کنید.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(
        err.message || "خطا در برقراری ارتباط با درگاه پرداخت. لطفا دوباره تلاش کنید."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
          >
            <div dir="rtl" className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">پرداخت اشتراک</h2>
                    <p className="text-orange-100 text-sm mt-1">
                      {planName} - {price} تومان
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Payment Info */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orange-500" />
                    اطلاعات پرداخت
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">نام اشتراک:</span>
                      <span className="font-semibold text-slate-800">{planName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">مبلغ:</span>
                      <span className="font-semibold text-slate-800">{price} تومان</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800">مراحل پرداخت:</h3>
                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        ۱
                      </span>
                      <span>روی دکمه "انتقال به درگاه پرداخت" کلیک کنید</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        ۲
                      </span>
                      <span>در صفحه درگاه باسلام، پرداخت را انجام دهید</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        ۳
                      </span>
                      <span>پس از پرداخت موفق، به صورت خودکار به سایت برمی‌گردید</span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>توجه:</strong> پس از پرداخت موفق، اشتراک شما به صورت خودکار فعال می‌شود.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  بستن
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      در حال انتقال...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      انتقال به درگاه پرداخت
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}