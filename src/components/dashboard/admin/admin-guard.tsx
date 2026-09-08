"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkSuperAdmin, type SuperAdminUser } from "@/lib/admin";
import { ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<
    "loading" | "ok" | "forbidden" | "inactive" | "unauthenticated"
  >("loading");
  const [user, setUser] = useState<SuperAdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gate = await checkSuperAdmin();
      if (cancelled) return;
      if (gate.status === "unauthenticated") {
        router.replace("/");
        setPhase("unauthenticated");
        return;
      }
      if (gate.status === "ok") {
        setUser(gate.user);
        setPhase("ok");
        return;
      }
      if (gate.status === "inactive") {
        setUser(gate.user ?? null);
        setPhase("inactive");
        return;
      }
      setPhase("forbidden");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (phase === "loading" || phase === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (phase === "inactive") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-800">حساب غیرفعال است</h1>
          <p className="text-sm text-slate-500 mt-2">
            {user?.phone_number ? `${user.phone_number} — ` : ""}
            این حساب فعال نیست و به پنل ادمین دسترسی ندارد.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-6 text-sm text-orange-600 hover:underline"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "forbidden") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-800">دسترسی ندارید</h1>
          <p className="text-sm text-slate-500 mt-2">
            این بخش فقط برای superadmin است.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-6 text-sm text-orange-600 hover:underline"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
