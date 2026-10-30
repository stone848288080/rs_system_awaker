import { Check, Loader2, Moon, Sun } from "lucide-react";
import { cn } from "../lib/cn";

interface StatusOrbProps {
  active: boolean;
  loading: boolean;
}

/** 中央大号状态图标：关闭置灰月亮，开启发光太阳。 */
export function StatusOrb({ active, loading }: StatusOrbProps) {
  return (
    <div
      className="relative flex h-[132px] w-[132px] items-center justify-center"
      aria-hidden="true"
    >
      {/* 径向渐变光晕：避免 WebKit 下 blur 滤镜在 backdrop 卡片中产生方形边界 */}
      <div
        className={cn(
          "absolute h-[172px] w-[172px] rounded-full transition-opacity duration-700",
          active ? "opacity-100" : "opacity-0",
        )}
        style={{
          background:
            "radial-gradient(circle, rgba(52,211,153,0.30) 0%, rgba(52,211,153,0.12) 42%, rgba(52,211,153,0) 70%)",
        }}
      />
      <div
        className={cn(
          "absolute h-[112px] w-[112px] rounded-full border border-emerald-400/35",
          active && !loading && "orb-halo",
        )}
      />
      <div
        className={cn(
          "relative flex h-[112px] w-[112px] items-center justify-center rounded-full border transition-all duration-500",
          active
            ? "border-emerald-300/60 bg-gradient-to-br from-emerald-300/25 via-teal-400/10 to-cyan-500/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_60px_-12px_rgba(16,185,129,0.65)] dark:border-emerald-400/30"
            : "border-slate-200/90 bg-gradient-to-br from-slate-50 to-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:from-white/[0.07] dark:to-white/[0.02]",
        )}
      >
        {loading ? (
          <Loader2 className="h-10 w-10 animate-spin text-slate-300 dark:text-slate-600" />
        ) : active ? (
          <Sun
            className="h-12 w-12 text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.35)] dark:text-emerald-400"
            strokeWidth={1.5}
          />
        ) : (
          <Moon
            className="h-12 w-12 text-slate-400 dark:text-slate-500"
            strokeWidth={1.5}
          />
        )}
        {active && !loading && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white/80 dark:ring-slate-900">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </span>
        )}
      </div>
    </div>
  );
}
