"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { userApi } from "@/lib/api";
import { motion } from "framer-motion";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean; // اگر true باشد، کاربر باید authenticated باشد
  requireActive?: boolean; // اگر true باشد، کاربر باید active باشد
}

/**
 * Auth Guard Component
 * بررسی می‌کند که کاربر authenticated و active است
 * اگر نه، به pricing page یا home redirect می‌کند
 */
export function AuthGuard({
  children,
  requireAuth = true,
  requireActive = true, // به طور پیش‌فرض active بودن رو چک می‌کنیم
}: AuthGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken();

        // اگر token نیست و requireAuth true است
        if (!token && requireAuth) {
          router.push("/pricing");
          return;
        }

        // اگر token نیست و requireAuth false است
        if (!token) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // اگر requireActive true است، باید user status رو چک کنیم
        if (requireActive) {
          try {
            const statusResponse = await userApi.getUserStatus();
            
            if (!statusResponse.success) {
              router.push("/pricing");
              return;
            }

            const user = (statusResponse as any).user;
            
            // اگر user is_active false است
            if (user && user.is_active === false) {
              router.push("/pricing");
              return;
            }

            setIsAuthorized(true);
          } catch (error) {
            console.error("Error checking user status:", error);
            // اگر خطا بود، به pricing redirect کن (برای امنیت)
            router.push("/pricing");
            return;
          }
        } else {
          setIsAuthorized(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requireAuth, requireActive]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
        />
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // redirect already happened
  }

  return <>{children}</>;
}
