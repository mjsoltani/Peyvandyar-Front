"use client";

import Link from "next/link";
import { Shield, Users, RefreshCw, Archive, Trash2 } from "lucide-react";

const CARDS = [
  {
    href: "/admin/users",
    title: "کاربران",
    desc: "جستجو، فیلتر، جزئیات و مدیریت اشتراک",
    icon: Users,
    tone: "bg-blue-100 text-blue-600",
  },
  {
    href: "/admin/tools/digikala-sync",
    title: "سینک دیجی‌کالا",
    desc: "سینک قیمت/موجودی یک کاربر یا همه",
    icon: RefreshCw,
    tone: "bg-orange-100 text-orange-600",
  },
  {
    href: "/admin/tools/archive-vendor",
    title: "آرشیو غرفه",
    desc: "غیرفعال‌کردن محصولات منتشرشده یک غرفه باسلام",
    icon: Archive,
    tone: "bg-slate-100 text-slate-700",
  },
  {
    href: "/admin/tools/trial-cleanup",
    title: "پاکسازی trial",
    desc: "غیرفعال‌کردن کاربرانی که اشتراک‌شان منقضی شده",
    icon: Trash2,
    tone: "bg-red-100 text-red-600",
  },
];

export default function AdminHomePage() {
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">پنل ادمین</h1>
          <p className="text-sm text-slate-500">
            فقط برای superadmin — با همان توکن لاگین عادی
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.tone}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="font-bold text-slate-800 mb-1">{card.title}</h2>
              <p className="text-sm text-slate-500">{card.desc}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
