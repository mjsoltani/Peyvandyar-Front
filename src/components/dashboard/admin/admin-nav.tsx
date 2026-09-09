"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "نمای کلی", exact: true },
  { href: "/admin/users", label: "کاربران" },
  { href: "/admin/plans", label: "پلن‌ها" },
  { href: "/admin/tools/digikala-sync", label: "سینک دیجی‌کالا" },
  { href: "/admin/tools/archive-vendor", label: "آرشیو غرفه" },
  { href: "/admin/tools/trial-cleanup", label: "پاکسازی trial" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm border transition-colors",
              active
                ? "bg-orange-50 border-orange-300 text-orange-800 font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:border-orange-200"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
