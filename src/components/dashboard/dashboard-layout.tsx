"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { removeAuthToken } from "@/lib/auth";
import { currencyApi } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  Headphones,
  LogOut,
  FileText,
  BarChart3,
  Shield,
  Copy,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import Link from "next/link";

// لوگوی پیوندیار
const PeyvandyarLogo = () => (
  <svg
    viewBox="0 0 120 80"
    className="w-8 h-6"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="layoutChain1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff5722" />
        <stop offset="100%" stopColor="#ff7043" />
      </linearGradient>
      <linearGradient id="layoutChain2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff7043" />
        <stop offset="100%" stopColor="#ff5722" />
      </linearGradient>
    </defs>
    <ellipse
      cx="38"
      cy="40"
      rx="22"
      ry="14"
      fill="none"
      stroke="url(#layoutChain1)"
      strokeWidth="10"
      strokeLinecap="round"
      transform="rotate(-35 38 40)"
    />
    <ellipse
      cx="82"
      cy="40"
      rx="22"
      ry="14"
      fill="none"
      stroke="url(#layoutChain2)"
      strokeWidth="10"
      strokeLinecap="round"
      transform="rotate(35 82 40)"
    />
  </svg>
);

const Logo = ({ open }: { open: boolean }) => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-slate-800 py-2 relative z-20"
    >
      <PeyvandyarLogo />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        className="font-bold text-slate-800 whitespace-pre"
      >
        پیوندیار
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-slate-800 py-2 relative z-20"
    >
      <PeyvandyarLogo />
    </Link>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(true);

  useEffect(() => {
    fetchUsdRate();
    // به‌روزرسانی هر 5 دقیقه
    const interval = setInterval(fetchUsdRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsdRate = async () => {
    try {
      const response = await currencyApi.getUsdRate();
      if (response.success && response.rate) {
        setUsdRate(response.rate);
      }
    } catch (error) {
      console.error("Error fetching USD rate:", error);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push("/");
  };

  const links = [
    {
      label: "داشبورد",
      href: "/dashboard",
      icon: (
        <LayoutDashboard className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "مدیریت محصولات",
      href: "/dashboard/products",
      icon: (
        <Package className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "ویرایش انبوه",
      href: "/dashboard/bulk-edit",
      icon: (
        <FileText className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "کپی محصول",
      href: "/dashboard/copy-product",
      icon: (
        <Copy className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "پنل ادمین",
      href: "/dashboard/admin",
      icon: (
        <Shield className="text-orange-600 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "پنل پشتیبانی",
      href: "/dashboard/support",
      icon: (
        <Headphones className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "تنظیمات",
      href: "/dashboard/settings",
      icon: (
        <Settings className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo open={open} /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-1">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "خروج",
                href: "#",
                icon: (
                  <LogOut className="text-red-500 h-5 w-5 flex-shrink-0" />
                ),
              }}
              className="hover:bg-red-50"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* USD Rate Button - Fixed Position */}
        <div className="fixed bottom-6 right-6 z-50">
          {isLoadingRate ? (
            <div className="bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-2 border border-slate-200">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"
              />
              <span className="text-sm text-slate-600">در حال بارگذاری...</span>
            </div>
          ) : usdRate ? (
            <ShimmerButton
              className="shadow-xl"
              background="linear-gradient(135deg, rgba(249, 115, 22, 0.95) 0%, rgba(234, 88, 12, 0.95) 100%)"
              shimmerColor="#ffffff"
              shimmerSize="0.1em"
              shimmerDuration="2.5s"
              borderRadius="12px"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="text-xs opacity-90">نرخ دلار</span>
                  <span className="font-bold text-base tracking-wide" dir="ltr">
                    {new Intl.NumberFormat("fa-IR").format(usdRate)} تومان
                  </span>
                </div>
              </div>
            </ShimmerButton>
          ) : (
            <div className="bg-white rounded-xl shadow-lg px-4 py-3 border border-slate-200">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">در دسترس نیست</span>
              </div>
            </div>
          )}
        </div>
        
        {children}
      </div>
    </div>
  );
}

