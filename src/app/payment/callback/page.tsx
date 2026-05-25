"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * صفحه callback قدیمی - فقط برای backward compatibility
 * این صفحه کاربر را به /payment/result redirect می‌کند
 */
function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // دریافت پارامترها و redirect به صفحه جدید
    const status = searchParams.get("status");
    const hashId = searchParams.get("hash_id");

    if (hashId) {
      // Redirect به صفحه result با حفظ پارامترها
      const params = new URLSearchParams();
      params.set("hash_id", hashId);
      if (status) params.set("status", status);
      
      router.replace(`/payment/result?${params.toString()}`);
    } else {
      // اگر hash_id نداشت، به صفحه اصلی برگرد
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50/30 to-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">در حال انتقال به صفحه نتیجه...</p>
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-orange-50/30 to-background flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </main>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
