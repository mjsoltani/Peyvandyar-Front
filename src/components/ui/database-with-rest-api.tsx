"use client";

import React from "react";
import { motion } from "framer-motion";
import { Store, ShoppingBag, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatabaseWithRestApiProps {
  className?: string;
  circleText?: string;
  badgeTexts?: {
    first: string;
    second: string;
    third: string;
    fourth: string;
  };
  buttonTexts?: {
    first: string;
    second: string;
  };
  title?: string;
  lightColor?: string;
}

const DatabaseWithRestApi = ({
  className,
  circleText,
  badgeTexts,
  buttonTexts,
  title,
  lightColor,
}: DatabaseWithRestApiProps) => {
  return (
    <div
      className={cn(
        "relative flex h-[350px] w-full max-w-[500px] flex-col items-center",
        className
      )}
    >
      {/* SVG Paths  */}
      <svg
        className="h-full sm:w-full text-muted"
        width="100%"
        height="100%"
        viewBox="0 0 200 100"
      >
        <g
          stroke="currentColor"
          fill="none"
          strokeWidth="0.4"
          strokeDasharray="100 100"
          pathLength="100"
        >
          <path d="M 31 10 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 10" />
          <path d="M 77 10 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 10" />
          <path d="M 124 10 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 10" />
          <path d="M 170 10 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10" />
          {/* Animation For Path Starting */}
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="1s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.25,0.1,0.5,1"
            keyTimes="0; 1"
          />
        </g>

        {/* Orange Lights */}
        <g mask="url(#db-mask-1)">
          <circle
            className="database db-light-1"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-orange-grad)"
          />
        </g>
        <g mask="url(#db-mask-2)">
          <circle
            className="database db-light-2"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-orange-grad)"
          />
        </g>
        <g mask="url(#db-mask-3)">
          <circle
            className="database db-light-3"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-orange-grad)"
          />
        </g>
        <g mask="url(#db-mask-4)">
          <circle
            className="database db-light-4"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-orange-grad)"
          />
        </g>

        {/* Buttons */}
        <g stroke="currentColor" fill="none" strokeWidth="0.4">
          {/* First Button - غرفه ۱ */}
          <g>
            <rect
              fill="#f97316"
              x="14"
              y="5"
              width="34"
              height="10"
              rx="5"
            ></rect>
            <StoreIcon x="18" y="7.5"></StoreIcon>
            <text
              x="40"
              y="11"
              fill="white"
              stroke="none"
              fontSize="4"
              fontWeight="500"
            >
              {badgeTexts?.first || "غرفه ۱"}
            </text>
          </g>

          {/* Second Button - غرفه ۲ */}
          <g>
            <rect
              fill="#f97316"
              x="60"
              y="5"
              width="34"
              height="10"
              rx="5"
            ></rect>
            <UsersIcon x="64" y="7.5"></UsersIcon>
            <text
              x="86"
              y="11"
              fill="white"
              stroke="none"
              fontSize="4"
              fontWeight="500"
            >
              {badgeTexts?.second || "غرفه ۲"}
            </text>
          </g>

          {/* Third Button - غرفه ۳ */}
          <g>
            <rect
              fill="#f97316"
              x="108"
              y="5"
              width="34"
              height="10"
              rx="5"
            ></rect>
            <PackageIcon x="112" y="7.5"></PackageIcon>
            <text
              x="134"
              y="11"
              fill="white"
              stroke="none"
              fontSize="4"
              fontWeight="500"
            >
              {badgeTexts?.third || "غرفه ۳"}
            </text>
          </g>

          {/* Fourth Button - غرفه ۴ */}
          <g>
            <rect
              fill="#f97316"
              x="150"
              y="5"
              width="40"
              height="10"
              rx="5"
            ></rect>
            <ShoppingBagIcon x="154" y="7.5"></ShoppingBagIcon>
            <text
              x="177"
              y="11"
              fill="white"
              stroke="none"
              fontSize="4"
              fontWeight="500"
            >
              {badgeTexts?.fourth || "غرفه ۴"}
            </text>
          </g>
        </g>

        <defs>
          {/* 1 - غرفه اصلی */}
          <mask id="db-mask-1">
            <path
              d="M 31 10 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 2 - فروشندگان */}
          <mask id="db-mask-2">
            <path
              d="M 77 10 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 3 - محصولات */}
          <mask id="db-mask-3">
            <path
              d="M 124 10 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 4 - سفارشات */}
          <mask id="db-mask-4">
            <path
              d="M 170 10 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* Orange Grad */}
          <radialGradient id="db-orange-grad" fx="1">
            <stop offset="0%" stopColor={lightColor || "#f97316"} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>

      {/* Main Box */}
      <div className="absolute bottom-10 flex w-full flex-col items-center">
        {/* bottom shadow */}
        <div className="absolute -bottom-4 h-[100px] w-[62%] rounded-lg bg-orange-500/10" />

        {/* box title */}
        <div className="absolute -top-3 z-20 flex items-center justify-center rounded-lg border bg-orange-600 px-2 py-1 sm:-top-4 sm:py-1.5">
          <Store className="size-3 text-white" />
          <span className="ml-2 text-[10px] text-white font-medium">
            {title ? title : "غرفه‌های متصل به پیوندیار"}
          </span>
        </div>

        {/* box outter circle */}
        <div className="absolute -bottom-8 z-30 grid h-[60px] w-[60px] place-items-center rounded-full border-t bg-orange-50 border-orange-200 font-semibold text-xs text-orange-700">
          {circleText ? circleText : "پیوندیار"}
        </div>

        {/* box content */}
        <div className="relative z-10 flex h-[150px] w-full items-center justify-center overflow-hidden rounded-lg border border-orange-200 bg-white shadow-md">
          {/* Badges */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10 h-7 rounded-full bg-orange-600 px-3 text-xs border border-orange-500 flex items-center gap-2 ">
            <Store className="size-4 text-white" />
            <span className="text-white font-medium">{buttonTexts?.first || "غرفه مادر"}</span>
          </div>
          <div className="absolute right-16 z-10 hidden h-7 rounded-full bg-orange-600 px-3 text-xs sm:flex border border-orange-500 items-center gap-2">
            <Package className="size-4 text-white" />
            <span className="text-white font-medium">{buttonTexts?.second || "v1.0"}</span>
          </div>

          {/* Circles */}
          <motion.div
            className="absolute -bottom-14 h-[100px] w-[100px] rounded-full border-t border-orange-200 bg-orange-50/30"
            animate={{
              scale: [0.98, 1.02, 0.98, 1, 1, 1, 1, 1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 h-[145px] w-[145px] rounded-full border-t border-orange-200 bg-orange-50/20"
            animate={{
              scale: [1, 1, 1, 0.98, 1.02, 0.98, 1, 1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-[100px] h-[190px] w-[190px] rounded-full border-t border-orange-200 bg-orange-50/15"
            animate={{
              scale: [1, 1, 1, 1, 1, 0.98, 1.02, 0.98, 1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-[120px] h-[235px] w-[235px] rounded-full border-t border-orange-200 bg-orange-50/10"
            animate={{
              scale: [1, 1, 1, 1, 1, 1, 0.98, 1.02, 0.98, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
};

export default DatabaseWithRestApi;

const StoreIcon = ({ x = "0", y = "0" }: { x: string; y: string }) => {
  return (
    <svg
      x={x}
      y={y}
      xmlns="http://www.w3.org/2000/svg"
      width="5"
      height="5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.18 2.18 0 0 1-2-2.18 2.18 2.18 0 0 0-2-2.18 2.18 2.18 0 0 0-2 2.18 2.18 2.18 0 0 1-2 2.18 2.18 2.18 0 0 1-2-2.18 2.18 2.18 0 0 0-2-2.18 2.18 2.18 0 0 0-2 2.18 2.18 2.18 0 0 1-2 2.18 2.18 2.18 0 0 1-2-2.18V7" />
    </svg>
  );
};

const UsersIcon = ({ x = "0", y = "0" }: { x: string; y: string }) => {
  return (
    <svg
      x={x}
      y={y}
      xmlns="http://www.w3.org/2000/svg"
      width="5"
      height="5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m22 21-3-3m0 0a2 2 0 0 0 0-4 2 2 0 0 0 0 4" />
    </svg>
  );
};

const PackageIcon = ({ x = "0", y = "0" }: { x: string; y: string }) => {
  return (
    <svg
      x={x}
      y={y}
      xmlns="http://www.w3.org/2000/svg"
      width="5"
      height="5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
};

const ShoppingBagIcon = ({ x = "0", y = "0" }: { x: string; y: string }) => {
  return (
    <svg
      x={x}
      y={y}
      xmlns="http://www.w3.org/2000/svg"
      width="5"
      height="5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
};