import { useI18n } from "../i18n";
import { cn } from "../lib/cn";
import type { PlatformInfo } from "../types";

interface PlatformBadgeProps {
  platform: PlatformInfo | null;
}

/** 顶部系统徽章：自动检测结果 + 支持状态。 */
export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const { t } = useI18n();
  const supported = platform?.supported ?? true;
  const pending = platform === null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        supported
          ? "border-slate-200/90 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300"
          : "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
      )}
      title={
        platform
          ? `${platform.displayName} · ${
              supported ? t("platform.supported") : t("platform.unsupported")
            }`
          : t("platform.detecting")
      }
    >
      <span aria-hidden="true" className="text-[12px] leading-none">
        {platform?.emoji ?? "💻"}
      </span>
      <span className="max-w-[76px] truncate">
        {platform?.displayName ?? t("platform.detecting")}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          pending
            ? "animate-pulse bg-slate-300 dark:bg-slate-600"
            : supported
              ? "bg-emerald-500"
              : "bg-rose-500",
        )}
      />
    </span>
  );
}
