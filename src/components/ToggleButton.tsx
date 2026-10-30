import { Loader2, Power, PowerOff } from "lucide-react";
import { useI18n } from "../i18n";
import { cn } from "../lib/cn";

interface ToggleButtonProps {
  active: boolean;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}

/** 主操作按钮：关闭态蓝色开启，开启态红色关闭。 */
export function ToggleButton({
  active,
  busy,
  disabled,
  onClick,
}: ToggleButtonProps) {
  const { t } = useI18n();
  const label = disabled
    ? t("action.unsupported")
    : active
      ? t("action.turnOff")
      : t("action.turnOn");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      aria-pressed={active}
      aria-busy={busy}
      className={cn(
        "group mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-3 text-[15px] font-semibold text-white outline-none transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
        "active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        active
          ? "bg-gradient-to-r from-rose-500 to-red-600 shadow-lg shadow-rose-500/25 hover:brightness-105 focus-visible:ring-rose-400"
          : "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 hover:brightness-105 focus-visible:ring-blue-400",
      )}
    >
      {busy ? (
        <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" />
      ) : active ? (
        <PowerOff className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />
      ) : (
        <Power className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />
      )}
      <span className="truncate">{busy ? t("action.switching") : label}</span>
    </button>
  );
}
