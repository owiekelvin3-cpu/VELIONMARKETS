import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AnimatedBackground } from "@/components/marketing/AnimatedBackground";
import { PageEnter } from "@/components/motion/Motion";

export function MarketingLayout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />
      <Header />
      <main className="relative pt-28 sm:pt-32">
        <PageEnter key={location.pathname}>
          <Outlet />
        </PageEnter>
      </main>
      <Footer />
    </div>
  );
}
