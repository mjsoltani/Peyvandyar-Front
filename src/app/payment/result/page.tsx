"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { paymentApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending">("loading");
  const [message, setMessage] = useState<string>("");
  const [details, setDetails] = useState<{
    amount?: number;
    total_amount?: number;
    hash_id?: string;
    paid_at?: string;
  }>({});

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // دریافت hash_id از URL
        const hashId = searchParams.get("hash_id");
        const urlStatus = searchParams.get("status"); // فقط برای نمایش اولیه

        if (!hashId) {
          setStatus("failed");
          setMessage("اطلاعات پرداخت ناقص است. لطفا با پشتیبانی تماس بگیرید.");
          return;
        }

        // نمایش وضعیت اولیه بر اساس URL (برای UX بهتر)
        if (urlStatus === "failed") {
          setStatus("failed");
          setMessage("در حال بررسی نهایی...");
        }

        // تایید نهایی از سرور (این مهمترین قسمت است)
        const response = await paymentApi.verifyPayment(hashId);

        if (response.success && response.status) {
          setStatus(response.status);
          setDetails({
            amount: response.amount,
            total_amount: response.total_amount,
            hash_id: response.hash_id,
            paid_at: response.paid_at,
          });

          // تنظیم پیام بر اساس وضعیت
          if (response.status === "success") {
            setMessage("پرداخت با موفقیت انجام شد و اشتراک شما فعال گردید! 🎉");
          } else if (response.status === "failed") {
            setMessage(response.message || "پرداخت ناموفق بود. لطفا دوباره تلاش کنید.");
          } else if (response.status === "pending") {
            setMessage("پرداخت در حال بررسی است. لطفا چند لحظه صبر کنید...");
          }
        } else {
          setStatus("failed");
          setMessage(response.message || response.error || "خطا در تایید پرداخت. لطفا با پشتیبانی تماس بگیرید.");
        }
      } catch (error: any) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setMessage(
          error.message || "خطا در ارتباط با سرور. لطفا اتصال اینترنت خود را بررسی کنید."
        );
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleRetry = () => {
    router.push("/subscription");
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-20 h-20 text-primary animate-spin" />;
      case "success":
        return <CheckCircle className="w-20 h-20 text-green-500" />;
      case "failed":
        return <XCircle className="w-20 h-20 text-destructive" />;
      case "pending":
        return <AlertCircle className="w-20 h-20 text-amber-500" />;
      default:
        return <AlertCircle className="w-20 h-20 text-muted-foreground" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case "loading":
        return "در حال بررسی پرداخت...";
      case "success":
        return "پرداخت موفق";
      case "failed":
        return "پرداخت ناموفق";
      case "pending":
        return "در انتظار تایید";
      default:
        return "وضعیت نامشخص";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "from-green-50 to-white";
      case "failed":
        return "from-red-50 to-white";
      case "pending":
        return "from-amber-50 to-white";
      default:
        return "from-muted to-white";
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50/30 to-background flex items-center justify-center p-4">
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg"
      >
        <Card className="shadow-2xl border-border">
          {/* Status Header */}
          <CardHeader className={`bg-gradient-to-b ${getStatusColor()} text-center space-y-4 pb-8`}>
            <div className="flex justify-center">{getStatusIcon()}</div>
            <CardTitle className="text-3xl font-bold">{getStatusTitle()}</CardTitle>
            <CardDescription className="text-base text-foreground/80">{message}</CardDescription>
          </CardHeader>

          {/* Details */}
          {status !== "loading" && (
            <CardContent className="space-y-4 pt-6">
              {details.hash_id && (
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <div className="text-sm text-muted-foreground">شناسه تراکنش</div>
                  <div className="font-mono text-sm text-foreground font-semibold break-all">
                    {details.hash_id}
                  </div>
                </div>
              )}

              {details.amount && (
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <div className="text-sm text-muted-foreground">مبلغ پرداختی</div>
                  <div className="text-lg text-foreground font-bold">
                    {(details.amount / 10).toLocaleString("fa-IR")} تومان
                  </div>
                  {details.total_amount && details.total_amount !== details.amount && (
                    <div className="text-xs text-muted-foreground">
                      (مبلغ کل با کارمزد: {(details.total_amount / 10).toLocaleString("fa-IR")} تومان)
                    </div>
                  )}
                </div>
              )}

              {details.paid_at && (
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <div className="text-sm text-muted-foreground">زمان پرداخت</div>
                  <div className="text-sm text-foreground font-semibold">
                    {new Date(details.paid_at).toLocaleString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          )}

          {/* Action Buttons */}
          {status !== "loading" && (
            <CardFooter className="flex flex-col gap-3 pt-2">
              {status === "success" && (
                <Button
                  onClick={handleGoToDashboard}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  ورود به داشبورد
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>
              )}

              {status === "failed" && (
                <Button
                  onClick={handleRetry}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  تلاش مجدد
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>
              )}

              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                بازگشت به صفحه اصلی
              </Button>

              {/* Support Info */}
              {(status === "failed" || status === "pending") && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-2 w-full">
                  <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                    <strong className="font-bold">نیاز به کمک دارید؟</strong>
                    <br />
                    با پشتیبانی تماس بگیرید:{" "}
                    <a
                      href="https://t.me/mjsoltani2001"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    >
                      @mjsoltani2001
                    </a>
                  </p>
                </div>
              )}
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </main>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-orange-50/30 to-background flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="bg-gradient-to-b from-muted to-white text-center space-y-4 pb-8">
              <div className="flex justify-center">
                <Loader2 className="w-20 h-20 text-primary animate-spin" />
              </div>
              <CardTitle className="text-3xl font-bold">در حال بررسی پرداخت...</CardTitle>
              <CardDescription className="text-base">لطفا صبر کنید...</CardDescription>
            </CardHeader>
          </Card>
        </main>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
