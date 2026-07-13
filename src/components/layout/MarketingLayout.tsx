import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AnimatedBackground } from "@/components/marketing/AnimatedBackground";
import { PageEnter } from "@/components/motion/Motion";

export function MarketingLayout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen min-h-dvh overflow-x-clip">
      <AnimatedBackground />
      <Header />
      <main className="relative pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-[calc(4rem+env(safe-area-inset-top))]">
        <PageEnter key={location.pathname}>
          <Outlet />
        </PageEnter>
      </main>
      <Footer />
    </div>
  );
}
