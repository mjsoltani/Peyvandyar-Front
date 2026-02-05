"use client";

import React, { useEffect, useState } from "react";
import { Store, Trash2, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

interface ChildStore {
  childVendorId: string;
  shop_name?: string;
  status: string;
  sync_status: string;
  last_sync?: string;
}

export function ChildStoresListCard() {
  const [childStores, setChildStores] = useState<ChildStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentVendorId, setParentVendorId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token') || document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];

        if (!token) {
          throw new Error('توکن احراز هویت یافت نشد');
        }

        // First get parent vendor ID
        const meResponse = await fetch('https://peyvandyar.amintvk.ir/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!meResponse.ok) {
          throw new Error('خطا در دریافت اطلاعات کاربر');
        }

        const meData = await meResponse.json();
        const vendorId = meData.vendor_id;
        setParentVendorId(vendorId);

        // Then get children
        const childrenResponse = await fetch(`https://peyvandyar.amintvk.ir/api/parent-child/children/${vendorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!childrenResponse.ok) {
          throw new Error('خطا در دریافت لیست غرفه‌ها');
        }

        const childrenData = await childrenResponse.json();
        setChildStores(childrenData.children || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطای نامشخص');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="flex w-full max-w-[600px] flex-col rounded-[14px] bg-muted/40 p-[4px] shadow-none">
        <CardContent className="relative flex flex-col overflow-hidden rounded-[10px] bg-background p-6 ring-1 ring-border">
          <div className="animate-pulse" dir="rtl">
            <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex w-full max-w-[600px] flex-col rounded-[14px] bg-muted/40 p-[4px] shadow-none">
      <CardContent className="relative flex flex-col overflow-hidden rounded-[10px] bg-background p-6 ring-1 ring-border">
        <div className="w-full" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                غرفه‌های متصل
              </CardTitle>
              <CardDescription className="text-slate-600">
                {childStores.length} غرفه فرعی متصل
              </CardDescription>
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Children List */}
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">خطا در بارگذاری</div>
              <div className="text-sm text-red-500">{error}</div>
            </div>
          ) : childStores.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-slate-600 mb-2">هنوز غرفه‌ای اضافه نشده</div>
              <div className="text-sm text-slate-500">
                برای شروع، غرفه فرعی خود را اضافه کنید
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {childStores.map((child, index) => (
                <div
                  key={child.childVendorId}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">
                        {child.shop_name || `غرفه ${index + 1}`}
                      </div>
                      <div className="text-sm text-slate-500">
                        شناسه: {child.childVendorId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      child.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {child.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </div>

                    {/* Action Buttons */}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}