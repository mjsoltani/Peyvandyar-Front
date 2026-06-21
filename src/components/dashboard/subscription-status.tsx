"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/shared/api/client";

interface TrialStatus {
  expires_at: string;
  remaining_days: number;
  remaining_hours: number;
  is_expired: boolean;
  status: string;
}

interface TrialStatusResponse {
  trial: TrialStatus;
}

function toJalali(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("fa-IR", {
      calendar: "persian",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function toFarsiNumber(n: number): string {
  return n.toLocaleString("fa-IR");
}

export function SubscriptionStatus({ open }: { open: boolean }) {
  const [trial, setTrial] = useState<TrialStatus | null>(null);

  useEffect(() => {
    apiClient
      .get<TrialStatusResponse>("/trial/status")
      .then((res) => {
        if (res?.trial) setTrial(res.trial);
      })
      .catch(() => {});
  }, []);

  if (!trial) return null;

  const isExpired = trial.is_expired || trial.status === "expired";
  const isWarning = !isExpired && trial.remaining_days <= 7;
  const isActive = !isExpired && !isWarning;

  const badge = isExpired
    ? { label: "منقضی شده", cls: "bg-red-100 text-red-600" }
    : isWarning
    ? { label: "رو به اتمام", cls: "bg-orange-100 text-orange-600" }
    : { label: "فعال", cls: "bg-green-100 text-green-600" };

  const jalaliDate = toJalali(trial.expires_at);

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm text-right">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}
        >
          {badge.label}
        </span>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-slate-500 font-medium"
            >
              اشتراک
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isExpired ? (
              <>
                <p className="text-xs text-slate-600 mb-2">
                  اشتراک شما به پایان رسیده است
                </p>
                <a
                  href="https://peyvand-yar.ir/subscription"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors rounded-lg py-1.5"
                >
                  تمدید اشتراک
                </a>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-0.5">اشتراک شما تا</p>
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  {jalaliDate}
                </p>
                <p className="text-xs text-slate-500 mb-2">
                  {isWarning && trial.remaining_days === 0
                    ? `${toFarsiNumber(trial.remaining_hours)} ساعت باقیمانده`
                    : `${toFarsiNumber(trial.remaining_days)} روز باقیمانده`}
                </p>
                {isWarning && (
                  <a
                    href="https://peyvand-yar.ir/subscription"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center text-xs font-bold text-orange-600 hover:underline"
                  >
                    اشتراک خود را تمدید کنید
                  </a>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
