"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Package, 
  Headphones,
  LogOut,
  FileText,
  Copy,
} from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { SubscriptionStatus } from "@/components/dashboard/subscription-status";
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
      label: "پنل پشتیبانی",
      href: "/dashboard/support",
      icon: (
        <Headphones className="text-slate-700 h-5 w-5 flex-shrink-0" />
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
          <div className="flex flex-col gap-2">
            <SubscriptionStatus open={open} />
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
        {children}
      </div>
    </div>
  );
}

