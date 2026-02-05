"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";
import IsoLevelWarp from "@/components/ui/isometric-wave-grid-background";
import DatabaseWithRestApi from "@/components/ui/database-with-rest-api";
import { Modal } from "@/components/ui/modal";

export default function MohammadianPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: "easeOut" as const,
            },
        }),
    };

    const handleExploreClick = () => {
        setIsModalOpen(true);
    };

    const handleConnectToPeyvandyar = () => {
        // اینجا باید به داشبورد محمدیان برود
        window.location.href = "/dashboard-mohammadian";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30">
            {/* Hero Section */}
            <div 
                dir="rtl"
                className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30"
            >
                {/* Interactive Background */}
                <IsoLevelWarp 
                    color="245, 124, 0" // Orange color matching Peyvandyar theme
                    density={60} 
                    speed={0.8}
                    className="bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30"
                />

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] via-transparent to-amber-500/[0.02] blur-3xl" />

                {/* Main content */}
                <div className="relative z-20 container mx-auto px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        {/* Title */}
                        <motion.div
                            custom={1}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 md:mb-8 tracking-tight leading-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-b from-slate-800 to-slate-600">
                                    تحویل نو در
                                </span>
                                <br />
                                <span
                                    className={cn(
                                        "bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500"
                                    )}
                                >
                                    مدیریت محصولات شما
                                </span>
                            </h1>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.div
                            custom={3}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                            className="relative z-30"
                        >
                            <button
                                onClick={handleExploreClick}
                                className="relative z-30 px-10 py-3.5 bg-gradient-to-l from-orange-600 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1 text-lg cursor-pointer"
                            >
                                کاوش کنید
                            </button>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom gradient fade */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/30 pointer-events-none z-0" />
            </div>

            {/* Second Section - Network Architecture */}
            <div 
                dir="rtl"
                className="relative py-20 px-4 md:px-6 bg-white"
            >
                <div className="container mx-auto">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Section Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="mb-16"
                        >
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-800">
                                سیستم غرفه مادر 
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
                                    {" "}پیوندیار
                                </span>
                            </h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                غرفه مادر محصولات را به صورت خودکار در تمام غرفه‌های فرعی توزیع می‌کند و مدیریت یکپارچه‌ای فراهم می‌آورد
                            </p>
                        </motion.div>

                        {/* Database Component */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="flex justify-center"
                        >
                            <DatabaseWithRestApi 
                                title="غرفه‌های متصل به پیوندیار"
                                circleText="پیوندیار"
                                badgeTexts={{
                                    first: "غرفه ۱",
                                    second: "غرفه ۲", 
                                    third: "غرفه ۳",
                                    fourth: "غرفه ۴"
                                }}
                                buttonTexts={{
                                    first: "غرفه مادر",
                                    second: "v1.0"
                                }}
                                lightColor="#f97316"
                            />
                        </motion.div>

                        {/* Features Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            viewport={{ once: true }}
                            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
                        >
                            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2">غرفه مادر</h3>
                                <p className="text-sm text-slate-600">مدیریت مرکزی و توزیع خودکار</p>
                            </div>

                            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2">غرفه ۱</h3>
                                <p className="text-sm text-slate-600">دریافت خودکار محصولات</p>
                            </div>

                            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2">غرفه ۲</h3>
                                <p className="text-sm text-slate-600">همگام‌سازی لحظه‌ای</p>
                            </div>

                            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2">غرفه ۳</h3>
                                <p className="text-sm text-slate-600">مدیریت موجودی هوشمند</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-8 text-center" dir="rtl">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Store className="w-8 h-8 text-orange-600" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">
                        اتصال به پیوندیار
                    </h3>
                    
                    {/* Description */}
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        لطفا غرفه مادر خود را وارد پیوندیار کنید تا بتوانید از امکانات سیستم غرفه‌های متصل استفاده نمایید
                    </p>
                    
                    {/* Buttons */}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            انصراف
                        </button>
                        <button
                            onClick={handleConnectToPeyvandyar}
                            className="px-6 py-2.5 bg-gradient-to-l from-orange-600 to-orange-500 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 font-medium"
                        >
                            ورود به پیوندیار
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}