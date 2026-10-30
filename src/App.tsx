import { AlertTriangle, Coffee, Info, Timer, X } from "lucide-react";
import { BatteryNotice } from "./components/BatteryNotice";
import { LanguageSwitch } from "./components/LanguageSwitch";
import { PlatformBadge } from "./components/PlatformBadge";
import { StatusOrb } from "./components/StatusOrb";
import { ToggleButton } from "./components/ToggleButton";
import { useKeepAwake } from "./hooks/useKeepAwake";
import { useI18n } from "./i18n";
import { describeError } from "./lib/errors";
import { formatDuration } from "./lib/format";

export default function App() {
  const { t } = useI18n();
  const {
    platform,
    status,
    active,
    elapsedSeconds,
    onBattery,
    busy,
    error,
    supported,
    toggle,
    dismissError,
  } = useKeepAwake();

  const loading = platform === null || status === null;
  const errorText = error === null ? null : describeError(error, t);

  return (
    <main className="relative flex h-full min-h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 px-5 py-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* 背景光晕 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-400/25 blur-3xl dark:bg-blue-500/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"
      />

      <section className="relative flex w-full max-w-[380px] flex-col rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900/75 dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]">
        {/* 顶部：品牌 + 语言切换 + 平台徽章 */}
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-slate-800 via-slate-900 to-black shadow-[0_6px_16px_-6px_rgba(15,23,42,0.7)] ring-1 ring-white/10 dark:from-white dark:via-slate-100 dark:to-slate-300 dark:ring-black/5">
              <Coffee
                className="h-[18px] w-[18px] text-emerald-300 dark:text-emerald-600"
                strokeWidth={2}
              />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
                KeepAwake
              </h1>
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                {t("app.tagline")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <LanguageSwitch />
            <PlatformBadge platform={platform} />
          </div>
        </header>

        {/* 中央状态区 */}
        <div className="mt-6 flex flex-col items-center">
          <StatusOrb active={active} loading={loading} />

          <h2
            aria-live="polite"
            className="mt-5 text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white"
          >
            {loading
              ? t("status.loading.title")
              : active
                ? t("status.active.title")
                : t("status.inactive.title")}
          </h2>
          <p className="mt-1 h-[18px] text-center text-[12px] leading-[18px] text-slate-500 dark:text-slate-400">
            {loading
              ? t("status.loading.subtitle")
              : active
                ? t("status.active.subtitle")
                : t("status.inactive.subtitle")}
          </p>

          {/* 计时器 */}
          <div className="mt-4 flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 dark:border-white/10 dark:bg-white/[0.04]">
            <Timer
              className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
              strokeWidth={2}
            />
            {active ? (
              <>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t("timer.label")}
                </span>
                <span className="font-mono text-[13px] font-semibold tabular-nums tracking-wide text-slate-700 dark:text-slate-200">
                  {formatDuration(elapsedSeconds)}
                </span>
              </>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {loading ? t("timer.loading") : t("timer.idle")}
              </span>
            )}
          </div>

          <ToggleButton
            active={active}
            busy={busy}
            disabled={!supported}
            onClick={() => void toggle()}
          />
        </div>

        <BatteryNotice visible={onBattery} />

        {errorText && (
          <div
            role="alert"
            className="app-enter mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/90 px-3 py-2.5 text-[11px] leading-relaxed text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
          >
            <AlertTriangle className="mt-[1px] h-4 w-4 shrink-0" />
            <p className="flex-1">{errorText}</p>
            <button
              type="button"
              onClick={dismissError}
              aria-label={t("error.dismiss")}
              className="-m-1 rounded-md p-1 text-rose-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {!loading && !supported && !errorText && (
          <p className="mt-3 text-center text-[11px] text-rose-500 dark:text-rose-400">
            {t("unsupported.notice")}
          </p>
        )}

        {/* 已知限制 */}
        <div className="mt-5 border-t border-slate-200/70 pt-3.5 dark:border-white/10">
          <div className="flex items-start gap-2 text-[10.5px] leading-relaxed text-slate-400 dark:text-slate-500">
            <Info className="mt-[1px] h-3.5 w-3.5 shrink-0" />
            <p>
              {t("limitations.prefix")}
              <kbd className="rounded border border-slate-300/70 bg-slate-100 px-1 py-px font-mono text-[9px] text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-400">
                Win+L
              </kbd>
              {t("limitations.suffix")}
            </p>
          </div>
        </div>
      </section>

      <p className="absolute bottom-3 text-[9.5px] tracking-wide text-slate-400/80 dark:text-slate-600">
        {t("footer")}
      </p>
    </main>
  );
}
