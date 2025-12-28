"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface ApiErrorDisplayProps {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
  compact?: boolean;
}

export function ApiErrorDisplay({ 
  error, 
  onRetry, 
  title = "خطا در دریافت اطلاعات",
  compact = false 
}: ApiErrorDisplayProps) {
  if (!error) return null;

  const isAuthError = error.message?.includes("401") || 
                      error.message?.includes("غیرمجاز") ||
                      error.message?.includes("Authentication");

  const isSubscriptionExpired = (error as any)?.isSubscriptionExpired || 
                                error.message?.includes("اشتراک شما به پایان رسیده است");

  const getErrorMessage = () => {
    if (isSubscriptionExpired) {
      return "اشتراک شما به پایان رسیده است. لطفا برای ادامه استفاده اشتراک تهیه کنید.";
    }
    if (isAuthError) {
      return "متاسفانه به خاطر مشکل پیش آمده نمی‌توانید وارد شوید. لطفا مجددا تلاش بفرمایید.";
    }
    return error.message || "خطا در ارتباط با سرور";
  };

  if (compact) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700 flex-1">
          {getErrorMessage()}
        </p>
        {onRetry && !isSubscriptionExpired && (
          <button
            onClick={onRetry}
            className="text-red-600 hover:text-red-700 transition-colors"
            title="تلاش مجدد"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-xl p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-800 mb-2">{title}</h3>
          <p className="text-red-700 mb-4">
            {getErrorMessage()}
          </p>
          {onRetry && !isSubscriptionExpired && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تلاش مجدد
            </button>
          )}
          {isSubscriptionExpired && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = "/subscription"}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  مشاهده اشتراک‌ها
                </button>
                <button
                  onClick={() => window.open("https://basalam.com/choonehbread", "_blank")}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  خرید مستقیم
                </button>
              </div>
              <p className="text-sm text-red-600">
                برای ادامه استفاده از پیوندیار، لطفا اشتراک تهیه کنید.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ApiSectionWrapperProps {
  children: React.ReactNode;
  error: Error | null;
  isLoading: boolean;
  onRetry?: () => void;
  loadingComponent?: React.ReactNode;
  errorTitle?: string;
  compact?: boolean;
}

export function ApiSectionWrapper({
  children,
  error,
  isLoading,
  onRetry,
  loadingComponent,
  errorTitle,
  compact = false
}: ApiSectionWrapperProps) {
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <ApiErrorDisplay 
        error={error} 
        onRetry={onRetry} 
        title={errorTitle}
        compact={compact}
      />
    );
  }

  return <>{children}</>;
}
