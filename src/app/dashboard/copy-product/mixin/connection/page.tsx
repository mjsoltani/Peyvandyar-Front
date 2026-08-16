"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { mixinApi, MixinConnection } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Plug,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  Unplug,
} from "lucide-react";

function isNoConnectionError(message: string) {
  return /No active Mixin connection/i.test(message);
}

export default function MixinConnectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connection, setConnection] = useState<MixinConnection | null>(null);
  const [shopUrl, setShopUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response: any = await mixinApi.getConnection();
      const data = response.data ?? response;
      setConnected(Boolean(data.connected));
      setConnection(data.connection ?? null);
      if (data.connection?.shop_url) {
        setShopUrl(String(data.connection.shop_url));
      }
    } catch (err: any) {
      setConnected(false);
      setConnection(null);
      if (!isNoConnectionError(err.message || "")) {
        setError(err.message || "خطا در دریافت وضعیت اتصال");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopUrl.trim() || !apiKey.trim()) {
      setError("آدرس فروشگاه و API Key الزامی است");
      return;
    }

    try {
      setConnecting(true);
      setError("");
      setSuccess("");
      const response: any = await mixinApi.connect({
        shop_url: shopUrl.trim(),
        api_key: apiKey.trim(),
      });
      const data = response.data ?? response;
      if (data.success === false) {
        setError(data.error || data.message || "اتصال ناموفق بود");
        return;
      }
      setApiKey("");
      setSuccess(data.message || "اتصال Mixin ذخیره و اعتبارسنجی شد");
      setConnected(true);
      setConnection(data.connection ?? null);
    } catch (err: any) {
      if (err.statusCode === 401) {
        setError("کلید Mixin معتبر نیست.");
      } else {
        setError(err.message || "خطا در اتصال به Mixin");
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const ok = window.confirm(
      "اتصال غیرفعال می‌شود. لینک‌های محصولات قبلی پاک نمی‌شوند. ادامه می‌دهید؟"
    );
    if (!ok) return;

    try {
      setDisconnecting(true);
      setError("");
      setSuccess("");
      await mixinApi.disconnect();
      setConnected(false);
      setConnection(null);
      setSuccess("اتصال Mixin غیرفعال شد");
    } catch (err: any) {
      setError(err.message || "خطا در قطع اتصال");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <button
            onClick={() => router.push("/dashboard/copy-product/mixin")}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Plug className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">اتصال فروشگاه Mixin</h1>
              <p className="text-sm text-slate-500">
                فقط shop_url و api_key لازم است؛ کلید را در مرورگر ذخیره نکنید
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-slate-500 bg-white rounded-xl border border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال بررسی اتصال...
            </div>
          ) : (
            <>
              {connected && connection && (
                <div className="mb-6 bg-white rounded-xl border border-slate-200 p-6 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">وضعیت</p>
                      <p className="font-bold text-green-700">متصل</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {disconnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unplug className="w-4 h-4" />
                      )}
                      قطع اتصال
                    </button>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">نام فروشگاه</p>
                    <p className="font-medium text-slate-800">
                      {connection.shop_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">آدرس</p>
                    <p className="font-medium text-slate-800" dir="ltr">
                      {connection.shop_url || "—"}
                    </p>
                  </div>
                  {connection.last_error && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      هشدار: {connection.last_error}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/copy-product/mixin/catalog")}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
                  >
                    رفتن به کاتالوگ
                  </button>
                </div>
              )}

              <form
                onSubmit={handleConnect}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
              >
                <h2 className="font-bold text-slate-800">
                  {connected ? "جایگزینی اتصال" : "اتصال جدید"}
                </h2>
                <p className="text-sm text-slate-500">
                  اتصال جدید برای همین کاربر جایگزین اتصال قبلی می‌شود.
                </p>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    آدرس فروشگاه Mixin
                  </label>
                  <input
                    type="text"
                    value={shopUrl}
                    onChange={(e) => setShopUrl(e.target.value)}
                    placeholder="https://myshop.mixin.ir"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                    dir="ltr"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="کلید API میکسین"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                    dir="ltr"
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={connecting}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال اتصال...
                    </>
                  ) : connected ? (
                    "ذخیره و جایگزینی اتصال"
                  ) : (
                    "اتصال"
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
