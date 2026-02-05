"use client";

import React, { useEffect, useState } from "react";
import { Store, Users, Package, ShoppingBag, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

interface ParentStoreData {
  vendor_id: string;
  shop_name: string;
  shop_url: string;
  status: string;
  children_count?: number;
}

export function ParentStoreInfoCard() {
  const [parentData, setParentData] = useState<ParentStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        const token = localStorage.getItem('auth_token') || document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];

        if (!token) {
          throw new Error('توکن احراز هویت یافت نشد');
        }

        const response = await fetch('https://peyvandyar.amintvk.ir/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('خطا در دریافت اطلاعات');
        }

        const data = await response.json();
        setParentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطای نامشخص');
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
  }, []);

  if (loading) {
    return (
      <Card className="flex w-full max-w-[500px] flex-col rounded-[14px] bg-muted/40 p-[4px] shadow-none">
        <CardContent className="relative flex flex-col items-center justify-center overflow-hidden rounded-[10px] bg-background p-6 ring-1 ring-border">
          <div className="animate-pulse flex flex-col items-center gap-4" dir="rtl">
            <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
            <div className="h-3 bg-gray-300 rounded w-48"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex w-full max-w-[500px] flex-col rounded-[14px] bg-red-50 p-[4px] shadow-none">
        <CardContent className="relative flex flex-col items-center justify-center overflow-hidden rounded-[10px] bg-background p-6 ring-1 ring-red-200">
          <div className="text-center" dir="rtl">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Store className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-lg text-red-800 mb-2">خطا در بارگذاری</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex w-full max-w-[500px] flex-col rounded-[14px] bg-muted/40 p-[4px] shadow-none">
      <CardContent className="relative flex flex-col items-center justify-center overflow-hidden rounded-[10px] bg-background p-0 ring-1 ring-border">
        <div className="z-10 flex w-full flex-col items-center justify-center gap-4 px-6 py-8 text-center" dir="rtl">
          {/* Store Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>

          {/* Store Info */}
          <div className="flex max-w-96 flex-col gap-2">
            <CardTitle className="text-xl font-bold text-slate-800">
              {parentData?.shop_name || 'غرفه مادر'}
            </CardTitle>
            <CardDescription className="tracking-[-0.006em] text-slate-600">
              شناسه فروشنده: {parentData?.vendor_id}
            </CardDescription>
            {parentData?.shop_url && (
              <CardDescription className="tracking-[-0.006em] text-orange-600 font-medium">
                {parentData.shop_url}
              </CardDescription>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {parentData?.status === 'active' ? 'فعال' : 'غیرفعال'}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="w-full grid grid-cols-2 gap-4 mt-4">
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="text-lg font-bold text-slate-800">
                {parentData?.children_count || 0}
              </div>
              <div className="text-xs text-slate-600">غرفه متصل</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div className="text-lg font-bold text-slate-800">-</div>
              <div className="text-xs text-slate-600">محصولات</div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">متصل به پیوندیار</span>
            </div>
            <p className="text-xs text-green-600 mt-1 text-center">
              آماده مدیریت غرفه‌های فرعی
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}