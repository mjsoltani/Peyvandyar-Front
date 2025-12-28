"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, CreditCard, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

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
  const [copied, setCopied] = useState(false);
  const cardNumber = "6219861906915771";

  const copyCardNumber = () => {
    navigator.clipboard.writeText(cardNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Card Number */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orange-500" />
                    شماره کارت
                  </h3>
                  <div className="flex items-center gap-3 bg-white rounded-lg p-3 border">
                    <span className="font-mono text-lg text-slate-800 flex-1">
                      {cardNumber}
                    </span>
                    <button
                      onClick={copyCardNumber}
                      className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1 text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "کپی شد!" : "کپی"}
                    </button>
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
                      <span>مبلغ {price} تومان را به شماره کارت بالا واریز کنید</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        ۲
                      </span>
                      <span>عکس رسید واریز را تهیه کنید</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        ۳
                      </span>
                      <span>از یکی از روش‌های زیر برای ارسال رسید استفاده کنید</span>
                    </div>
                  </div>
                </div>

                {/* Contact Methods */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => window.open("https://basalam.com/choonehbread", "_blank")}
                    className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-800">باسلام</div>
                      <div className="text-xs text-blue-600">ارسال پیام</div>
                    </div>
                  </button>

                  <button
                    onClick={() => window.open("https://t.me/mjsoltani2001", "_blank")}
                    className="flex items-center gap-3 p-4 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors border border-sky-200"
                  >
                    <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                      <Send className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sky-800">تلگرام</div>
                      <div className="text-xs text-sky-600">@mjsoltani2001</div>
                    </div>
                  </button>
                </div>

                {/* Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>توجه:</strong> پس از ارسال رسید، اشتراک شما ظرف ۲۴ ساعت فعال خواهد شد.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                >
                  بستن
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}