"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { userApi } from "@/lib/api";
import { apiClient } from "@/shared/api/client";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  Store,
  Hash,
  Shield,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ApiSectionWrapper } from "@/components/dashboard/api-error-boundary";

interface UserProfile {
  username: string;
  basalam_user_id: number;
  basalam_vendor_id: number;
  vendor_title: string;
  phoneNumber?: string;
  isActive?: boolean;
}

interface TrialStatus {
  expires_at: string;
  remaining_days: number;
  remaining_hours: number;
  is_expired: boolean;
  status: "active" | "premium" | "expired";
}

function toJalali(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      calendar: "persian",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(isoDate));
  } catch {
    return "";
  }
}

function toFarsiNumber(n: number): string {
  return n.toLocaleString("fa-IR");
}

function SubscriptionBadge({ status }: { status: "active" | "premium" | "expired" }) {
  const config = {
    active: { label: "فعال", cls: "bg-green-100 text-green-700 border-green-200" },
    premium: { label: "پریمیوم", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    expired: { label: "منقضی شده", cls: "bg-red-100 text-red-700 border-red-200" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${config.cls}`}>
      {status === "expired" ? (
        <XCircle className="w-3.5 h-3.5" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5" />
      )}
      {config.label}
    </span>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-6" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex justify-between items-center py-3.5 border-b border-slate-100 last:border-0">
          <div className="h-3 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<Error | null>(null);

  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [trialLoading, setTrialLoading] = useState(true);
  const [trialError, setTrialError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const res = await userApi.getProfile();
      // API مستقیماً user را در root response برمی‌گرداند
      if (res?.success && res?.user) {
        setProfile(res.user);
      } else if (res?.success && res?.data?.user) {
        setProfile(res.data.user);
      } else if (res?.success && res?.data) {
        setProfile(res.data);
      } else {
        throw new Error("اطلاعات پروفایل دریافت نشد");
      }
    } catch (e: any) {
      setProfileError(e);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchTrial = async () => {
    try {
      setTrialLoading(true);
      setTrialError(null);
      const res = await apiClient.get<any>("/trial/status");
      if (res?.trial) {
        setTrial(res.trial);
        if (res?.user && !profile?.phoneNumber) {
          setProfile((prev) =>
            prev
              ? { ...prev, phoneNumber: res.user.phoneNumber, isActive: res.user.isActive }
              : prev
          );
        }
      } else {
        throw new Error("اطلاعات اشتراک دریافت نشد");
      }
    } catch (e: any) {
      setTrialError(e);
    } finally {
      setTrialLoading(false);
    }
  };

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/");
      return;
    }
    fetchProfile();
    fetchTrial();
  }, [router]);

  const showWarning =
    trial && !trial.is_expired && trial.status !== "expired" && trial.remaining_days <= 7;

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">پروفایل کاربری</h1>
              <p className="text-sm text-slate-500 mt-0.5">مشخصات حساب و وضعیت اشتراک</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* بخش ۱ — اطلاعات حساب */}
            {profileLoading ? (
              <SkeletonCard />
            ) : profileError ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-base font-bold text-slate-700 mb-4">اطلاعات حساب</h2>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700">خطا در دریافت اطلاعات حساب</p>
                  </div>
                  <button
                    onClick={fetchProfile}
                    className="text-xs text-red-600 underline"
                  >
                    تلاش مجدد
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 p-6"
              >
                <h2 className="text-base font-bold text-slate-700 mb-2">اطلاعات حساب</h2>
                <div className="divide-y divide-slate-100">
                  <InfoRow
                    icon={User}
                    label="نام کاربری"
                    value={profile?.username || "—"}
                  />
                  {profile?.phoneNumber && (
                    <InfoRow
                      icon={Phone}
                      label="شماره تلفن"
                      value={profile.phoneNumber}
                    />
                  )}
                  <InfoRow
                    icon={Hash}
                    label="شناسه کاربر باسلام"
                    value={
                      profile?.basalam_user_id
                        ? toFarsiNumber(profile.basalam_user_id)
                        : "—"
                    }
                  />
                  <InfoRow
                    icon={Store}
                    label="شناسه غرفه"
                    value={
                      profile?.basalam_vendor_id
                        ? toFarsiNumber(profile.basalam_vendor_id)
                        : "—"
                    }
                  />
                  <InfoRow
                    icon={Store}
                    label="نام غرفه"
                    value={profile?.vendor_title || "—"}
                  />
                  <InfoRow
                    icon={Shield}
                    label="وضعیت حساب"
                    value={
                      profile?.isActive !== undefined ? (
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-semibold ${
                            profile.isActive ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {profile.isActive ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {profile.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      ) : (
                        "—"
                      )
                    }
                  />
                </div>
              </motion.div>
            )}

            {/* بخش ۲ — جزئیات اشتراک */}
            {trialLoading ? (
              <SkeletonCard />
            ) : trialError ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-base font-bold text-slate-700 mb-4">جزئیات اشتراک</h2>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700">خطا در دریافت اطلاعات اشتراک</p>
                  </div>
                  <button
                    onClick={fetchTrial}
                    className="text-xs text-red-600 underline"
                  >
                    تلاش مجدد
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-700">جزئیات اشتراک</h2>
                  {trial && <SubscriptionBadge status={trial.status} />}
                </div>

                {trial && (
                  <div className="divide-y divide-slate-100 mb-5">
                    <InfoRow
                      icon={Calendar}
                      label="تاریخ انقضا"
                      value={toJalali(trial.expires_at)}
                    />
                    <InfoRow
                      icon={Clock}
                      label="باقیمانده"
                      value={
                        trial.remaining_days === 0
                          ? `${toFarsiNumber(trial.remaining_hours)} ساعت`
                          : trial.remaining_days <= 7
                          ? `${toFarsiNumber(trial.remaining_days)} روز و ${toFarsiNumber(trial.remaining_hours)} ساعت`
                          : `${toFarsiNumber(trial.remaining_days)} روز`
                      }
                    />
                  </div>
                )}

                {/* هشدار رو به اتمام */}
                {showWarning && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <p className="text-xs text-orange-700">
                      اشتراک شما رو به اتمام است. برای جلوگیری از قطع دسترسی تمدید کنید.
                    </p>
                  </div>
                )}

                <a
                  href="https://peyvand-yar.ir/subscription"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  تمدید اشتراک
                </a>
              </motion.div>
            )}

            {/* حالت هر دو خطا */}
            {profileError && trialError && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">اطلاعات در دسترس نیست</p>
                <p className="text-sm text-slate-400 mt-1">لطفا اتصال اینترنت خود را بررسی کنید</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
