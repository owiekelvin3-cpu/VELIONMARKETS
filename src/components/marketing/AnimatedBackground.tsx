import { GlowOrb } from "@/components/motion/Motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-void" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute inset-0 noise opacity-40" />

      <div className="absolute inset-0 animate-aurora bg-gradient-hero" />

      <GlowOrb className="left-[-15%] top-[-15%] h-[600px] w-[600px]" />
      <GlowOrb className="right-[-10%] top-[15%] h-[500px] w-[500px] bg-emerald/8" />
      <GlowOrb className="bottom-[-20%] left-[20%] h-[700px] w-[700px] bg-emerald/6" />

      <div
        className="absolute -right-[20%] top-[40%] h-[400px] w-[400px] rounded-full opacity-30 blur-[100px] animate-pulse-glow"
        style={{ background: "radial-gradient(circle, rgba(201,162,39,0.15) 0%, transparent 70%)" }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 100% 80% at 50% 100%, rgba(9,9,11,0.8), transparent 70%)",
        }}
      />
    </div>
  );
}
