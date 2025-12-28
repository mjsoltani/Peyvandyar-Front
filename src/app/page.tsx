"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { IntegrationSection } from "@/components/ui/integration-section";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import { GuideSection } from "@/components/ui/guide-section";
import { DashboardPreview } from "@/components/ui/dashboard-preview";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Footer } from "@/components/ui/footer";
import { BASALAM_SSO_URL } from "@/lib/auth";
import { Home, Zap, HelpCircle, LogIn, CreditCard } from "lucide-react";

const navItems = [
  { name: "خانه", url: "#", icon: Home },
  { name: "امکانات", url: "#features", icon: Zap },
  { name: "راهنما", url: "#guide", icon: HelpCircle },
  { name: "اشتراک", url: "/subscription", icon: CreditCard },
  { name: "ورود", url: BASALAM_SSO_URL, icon: LogIn },
];

export default function HomePage() {
  return (
    <main>
      <NavBar items={navItems} />
      <HeroGeometric
        badge="پیوندیار"
        title1="مدیریت کامل محصولات"
        title2="برای فروشندگان باسلام"
        description="کپی، ویرایش و مدیریت محصولات باسلام با سرعت و کارایی بالا. بیش از ۱۵۰۰ محصول را به صورت همزمان مدیریت کنید"
      />
      <IntegrationSection />
      <div id="features">
        <FeaturesSectionWithHoverEffects />
      </div>
      <DashboardPreview />
      <div id="guide">
        <GuideSection />
      </div>
      <Footer />
    </main>
  );
}
