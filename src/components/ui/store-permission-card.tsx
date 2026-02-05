"use client";

import React, { useState } from "react";
import { Store, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

interface StorePermissionCardProps {
  onTokenSubmit?: (token: string) => void;
}

export function StorePermissionCard({ onTokenSubmit }: StorePermissionCardProps) {
  const [token, setToken] = useState("");

  const handleSubmit = () => {
    if (token.trim() && onTokenSubmit) {
      onTokenSubmit(token.trim());
    }
  };

  return (
    <Card className="flex w-full max-w-[500px] flex-col rounded-[14px] bg-muted/40 p-[4px] shadow-none">
      <CardContent className="relative flex flex-col items-center justify-center overflow-hidden rounded-[10px] bg-background p-0 ring-1 ring-border">
        <div className="z-10 flex w-full flex-col items-center justify-center gap-4 px-6 py-8 text-center" dir="rtl">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>

          <div className="flex max-w-96 flex-col gap-1.5">
            <CardTitle className="text-lg">غرفه‌های مرتبط به خود را اضافه کنید</CardTitle>
            <CardDescription className="tracking-[-0.006em]">
              برای اتصال غرفه‌های فرعی به غرفه مادر، لطفاً توکن دسترسی باسلام را وارد کنید
            </CardDescription>
          </div>

          <div className="relative w-full overflow-hidden rounded-xl bg-accent/70 p-6 ring-1 ring-border ring-inset dark:bg-popover">
            <div className="ml-8 grid w-full grid-cols-[70px_1fr] overflow-hidden rounded-xl bg-card ring-1 ring-border drop-shadow-xl">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden border-r bg-[repeating-linear-gradient(-60deg,var(--color-border)_0_0.5px,transparent_0.5px_8px)]">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center ml-10">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <span className="absolute top-3 left-3 size-[11px] rounded-full bg-gradient-to-b from-green-600 via-green-500 to-green-400 inset-shadow-sm inset-shadow-green-300"></span>
              </div>
              <div className="flex flex-col gap-2 p-4">
                <div className="flex flex-col gap-0.5 text-right">
                  <h3 className="text-sm font-medium tracking-[-0.006em]">اجازه دسترسی به غرفه</h3>
                  <p className="text-xs tracking-[-0.006em] text-muted-foreground">
                    برای اتصال غرفه فرعی، توکن دسترسی را وارد کنید
                  </p>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="link" size="sm" className="p-0 text-xs text-muted-foreground">
                    انصراف
                  </Button>
                  <Button variant="link" size="sm" className="p-0 text-xs">
                    تایید
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-1"
          >
            <AccordionItem
              value="item-1"
              className="ring-1 ring-border dark:bg-popover rounded-lg px-4"
            >
              <AccordionTrigger className="text-sm dark:bg-popover">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="size-4 text-muted-foreground" />
                  راهنمای مرحله به مرحله
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="mr-6 list-decimal space-y-2 text-right tracking-[-0.006em]">
                  <li>
                    به{" "}
                    <span className="font-bold text-orange-600">developers.basalam.com</span>{" "}
                    مراجعه کنید
                  </li>
                  <li>
                    روی <span className="font-bold">ورود به پنل</span> کلیک کنید و به قسمت{" "}
                    <span className="font-bold">توکن‌های دسترسی شخصی</span> بروید
                  </li>
                  <li>
                    روی <span className="font-bold">ایجاد توکن شخصی</span> کلیک کنید و تمامی تیک‌ها را بزنید و یک اسم انگلیسی برای توکن خود انتخاب کنید
                  </li>
                  <li>
                    توکن را در کادر زیر وارد کنید
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="z-10 w-full border-t bg-background" dir="rtl">
          {/* Token Input */}
          <div className="flex flex-col gap-2 px-6 pt-4">
            <label className="text-sm font-medium text-right">توکن دسترسی باسلام:</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="توکن خود را اینجا وارد کنید..."
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              dir="ltr"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between px-6 py-4">
            <Button variant="outline">نیاز به راهنمایی دارید؟</Button>
            <Button onClick={handleSubmit} disabled={!token.trim()}>
              اضافه کردن غرفه
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}