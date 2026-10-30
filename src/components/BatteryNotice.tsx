import { BatteryWarning } from "lucide-react";
import { useI18n } from "../i18n";

/** 电池供电提示：仅在使用电池时出现。 */
export function BatteryNotice({ visible }: { visible: boolean }) {
  const { t } = useI18n();

  if (!visible) return null;

  return (
    <div
      role="note"
      className="app-enter mt-3 flex items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-50/90 px-3 py-2.5 dark:border-amber-400/25 dark:bg-amber-400/10"
    >
      <BatteryWarning className="mt-[1px] h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
        {t("battery.warning")}
      </p>
    </div>
  );
}
