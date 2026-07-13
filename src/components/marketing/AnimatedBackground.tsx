import { useTheme } from "@/hooks/useTheme";
import { GlowOrb } from "@/components/motion/Motion";

export function AnimatedBackground() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-void" />
      <div className={isLight ? "absolute inset-0 grid-pattern opacity-50" : "absolute inset-0 grid-pattern opacity-30"} />
      <div className={isLight ? "absolute inset-0 noise opacity-20" : "absolute inset-0 noise opacity-40"} />

      <div className="absolute inset-0 animate-aurora bg-gradient-hero motion-reduce:animate-none" />

      <GlowOrb className="left-[-15%] top-[-15%] h-[min(600px,80vw)] w-[min(600px,80vw)] max-md:opacity-70" />
      <GlowOrb className="right-[-10%] top-[15%] h-[min(500px,70vw)] w-[min(500px,70vw)] bg-emerald/8 max-md:hidden" />
      <GlowOrb className="bottom-[-20%] left-[20%] h-[min(700px,90vw)] w-[min(700px,90vw)] bg-emerald/6 max-md:opacity-50" />

      <div
        className="absolute -right-[20%] top-[40%] h-[min(400px,60vw)] w-[min(400px,60vw)] rounded-full opacity-30 blur-[80px] animate-pulse-glow motion-reduce:animate-none max-md:blur-[60px]"
        style={{
          background: isLight
            ? "radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(201,162,39,0.15) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "radial-gradient(ellipse 100% 80% at 50% 100%, rgba(241,245,249,0.9), transparent 70%)"
            : "radial-gradient(ellipse 100% 80% at 50% 100%, rgba(9,9,11,0.8), transparent 70%)",
        }}
      />
    </div>
  );
}
