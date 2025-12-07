"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { IntegrationSection } from "@/components/ui/integration-section";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Footer } from "@/components/ui/footer";
import { BASALAM_SSO_URL } from "@/lib/auth";
import { Home, Zap, HelpCircle, LogIn } from "lucide-react";

const navItems = [
  { name: "خانه", url: "#", icon: Home },
  { name: "امکانات", url: "#features", icon: Zap },
  { name: "راهنما", url: "#guide", icon: HelpCircle },
  { name: "ورود", url: BASALAM_SSO_URL, icon: LogIn },
];

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // اگر کاربر authenticated است، به dashboard redirect کن
    const token = getAuthToken();
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <main>
      <NavBar items={navItems} />
      <HeroGeometric
        badge="پیوندیار"
        title1="ویرایش انبوه محصولات"
        title2="برای فروشندگان باسلام"
        description="ویرایش بیش از ۱۵۰۰ محصول به صورت همزمان، بدون محدودیت و با سرعت بالا"
      />
      <IntegrationSection />
      <FeaturesSectionWithHoverEffects />
      <Footer />
    </main>
  );
}
