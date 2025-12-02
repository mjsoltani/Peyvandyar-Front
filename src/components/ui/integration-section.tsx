"use client";

import React, { forwardRef, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { 
  ShoppingBag, 
  Package, 
  Tags, 
  Image as ImageIcon, 
  FileText, 
  BarChart3 
} from "lucide-react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 border-orange-200 bg-white p-3 shadow-[0_0_20px_-12px_rgba(245,124,0,0.5)]",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

// لوگوی پیوندیار - زنجیر نارنجی (مشابه تصویر)
const PeyvandyarLogo = () => (
  <svg
    viewBox="0 0 120 80"
    className="w-full h-full"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="chainGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff5722" />
        <stop offset="100%" stopColor="#ff7043" />
      </linearGradient>
      <linearGradient id="chainGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff7043" />
        <stop offset="100%" stopColor="#ff5722" />
      </linearGradient>
    </defs>
    {/* Left chain link - tilted */}
    <ellipse
      cx="38"
      cy="40"
      rx="22"
      ry="14"
      fill="none"
      stroke="url(#chainGradient1)"
      strokeWidth="10"
      strokeLinecap="round"
      transform="rotate(-35 38 40)"
    />
    {/* Right chain link - tilted opposite */}
    <ellipse
      cx="82"
      cy="40"
      rx="22"
      ry="14"
      fill="none"
      stroke="url(#chainGradient2)"
      strokeWidth="10"
      strokeLinecap="round"
      transform="rotate(35 82 40)"
    />
  </svg>
);

export function IntegrationSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.2 + i * 0.15,
        ease: "easeOut" as const,
      },
    }),
  };

  return (
    <section 
      dir="rtl"
      className="relative pt-8 md:pt-12 pb-20 md:pb-32 bg-gradient-to-b from-white via-orange-50/30 to-white overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/[0.1] border border-orange-500/[0.2] mb-6"
          >
            <span className="text-sm text-orange-700 font-semibold">
              یکپارچه‌سازی
            </span>
          </motion.div>

          <motion.h2
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-slate-800 to-slate-600">
              اتصال مستقیم به
            </span>{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
              باسلام
            </span>
          </motion.h2>

          <motion.p
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            پیوندیار به صورت مستقیم به پنل فروشندگان باسلام متصل می‌شود و امکان ویرایش انبوه تمام بخش‌های محصولات را فراهم می‌کند
          </motion.p>
        </div>

        {/* Animated Beam Section */}
        <motion.div
          custom={3}
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div
            className="relative flex h-[400px] md:h-[500px] w-full items-center justify-center overflow-hidden rounded-2xl border border-orange-100 bg-white/80 backdrop-blur-sm p-6 md:p-10 shadow-xl shadow-orange-500/5"
            ref={containerRef}
          >
            <div className="flex size-full flex-col max-w-lg max-h-[280px] items-stretch justify-between gap-10">
              {/* Top Row */}
              <div className="flex flex-row items-center justify-between">
                <Circle ref={div1Ref}>
                  <ShoppingBag className="w-6 h-6 text-orange-500" />
                </Circle>
                <Circle ref={div5Ref}>
                  <Package className="w-6 h-6 text-orange-500" />
                </Circle>
              </div>

              {/* Middle Row */}
              <div className="flex flex-row items-center justify-between">
                <Circle ref={div2Ref}>
                  <Tags className="w-6 h-6 text-orange-500" />
                </Circle>
                
                {/* Center Logo - Peyvandyar */}
                <Circle ref={div4Ref} className="size-20 md:size-24 border-orange-300 shadow-[0_0_30px_-8px_rgba(245,124,0,0.4)]">
                  <PeyvandyarLogo />
                </Circle>
                
                <Circle ref={div6Ref}>
                  <ImageIcon className="w-6 h-6 text-orange-500" />
                </Circle>
              </div>

              {/* Bottom Row */}
              <div className="flex flex-row items-center justify-between">
                <Circle ref={div3Ref}>
                  <FileText className="w-6 h-6 text-orange-500" />
                </Circle>
                <Circle ref={div7Ref}>
                  <BarChart3 className="w-6 h-6 text-orange-500" />
                </Circle>
              </div>
            </div>

            {/* Animated Beams - Left Side */}
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div1Ref}
              toRef={div4Ref}
              curvature={-75}
              endYOffset={-10}
              gradientStartColor="#ff6b00"
              gradientStopColor="#ffaa00"
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div2Ref}
              toRef={div4Ref}
              gradientStartColor="#ff6b00"
              gradientStopColor="#ffaa00"
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div3Ref}
              toRef={div4Ref}
              curvature={75}
              endYOffset={10}
              gradientStartColor="#ff6b00"
              gradientStopColor="#ffaa00"
            />

            {/* Animated Beams - Right Side (Reverse) */}
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div5Ref}
              toRef={div4Ref}
              curvature={-75}
              endYOffset={-10}
              reverse
              gradientStartColor="#ff6b00"
              gradientStopColor="#ffaa00"
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div6Ref}
              toRef={div4Ref}
              reverse
              gradientStartColor="#ff6b00"
              gradientStopColor="#ffaa00"
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div7Ref}
              toRef={div4Ref}
              curvature={75}
              endYOffset={10}
              reverse
              gradientStartColor="#ff6b00"
              gradientStopColor="#ffaa00"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

