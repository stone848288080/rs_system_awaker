import { cn } from "../lib/cn";
import { useI18n } from "../i18n";
import type { Language } from "../i18n/messages";

const OPTIONS: ReadonlyArray<{ value: Language; label: string }> = [
  { value: "en", label: "EN" },
  { value: "zh", label: "中" },
];

/** 顶栏语言切换：EN / 中，默认 EN。 */
export function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("language.switch")}
      title={t("language.switch")}
      className="flex items-center gap-0.5 rounded-full border border-slate-200/90 bg-white/70 p-0.5 dark:border-white/10 dark:bg-white/[0.06]"
    >
      {OPTIONS.map((option) => {
        const selected = language === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLanguage(option.value)}
            aria-pressed={selected}
            aria-label={
              option.value === "en"
                ? t("language.english")
                : t("language.chinese")
            }
            className={cn(
              "flex h-6 min-w-[26px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-blue-400/70",
              selected
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
