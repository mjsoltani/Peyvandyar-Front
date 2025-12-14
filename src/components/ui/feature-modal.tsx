"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  details: string;
  icon: React.ReactNode;
}

export function FeatureModal({
  isOpen,
  onClose,
  title,
  description,
  details,
  icon,
}: FeatureModalProps) {
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div dir="rtl" className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white">
                    {icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    <p className="text-orange-100 text-sm mt-1">{description}</p>
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
              <div className="px-6 py-6">
                <div className="space-y-4 text-slate-700 leading-relaxed">
                  {details.split("\n").map((paragraph, idx) => (
                    <p key={idx} className="text-sm">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  متوجه شدم
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
