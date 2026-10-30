import { useCallback, useEffect, useRef, useState } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getPlatform, getStatus, isOnBattery, setAwake } from "../lib/tauri";
import type { AwakeStatus, PlatformInfo } from "../types";

const BATTERY_POLL_MS = 20_000;

/**
 * 组合防锁定状态、平台信息、计时器与电池提示。
 * 后端通过 `awake-state-changed` 事件推送托盘侧触发的状态变更。
 */
export function useKeepAwake() {
  const [platform, setPlatform] = useState<PlatformInfo | null>(null);
  const [status, setStatus] = useState<AwakeStatus | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const unlisteners: UnlistenFn[] = [];

    const init = async () => {
      try {
        const [info, current] = await Promise.all([getPlatform(), getStatus()]);
        if (cancelled) return;

        setPlatform(info);
        setStatus(current);
        setNow(Date.now());

        const stopState = await listen<AwakeStatus>(
          "awake-state-changed",
          (event) => {
            setStatus(event.payload);
            setNow(Date.now());
            setError(null);
          },
        );

        const stopError = await listen<unknown>("awake-error", (event) => {
          setError(event.payload);
        });

        if (cancelled) {
          stopState();
          stopError();
        } else {
          unlisteners.push(stopState, stopError);
        }
      } catch (cause) {
        if (!cancelled) setError(cause);
      }
    };

    void init();

    return () => {
      cancelled = true;
      for (const unlisten of unlisteners) unlisten();
    };
  }, []);

  // 仅在开启时驱动 1s 计时，关闭后立即停止。
  useEffect(() => {
    if (!status?.active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [status?.active]);

  const refreshBattery = useCallback(async () => {
    try {
      const onBattery = await isOnBattery();
      setStatus((previous) =>
        previous && previous.onBattery !== onBattery
          ? { ...previous, onBattery }
          : previous,
      );
    } catch {
      // 电池信息只是提示，读取失败时保持上一次结果。
    }
  }, []);

  // 启动时 + 定期 + 窗口重新聚焦时刷新供电状态。
  useEffect(() => {
    void refreshBattery();
    const timer = window.setInterval(() => void refreshBattery(), BATTERY_POLL_MS);
    window.addEventListener("focus", refreshBattery);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshBattery);
    };
  }, [refreshBattery]);

  const toggle = useCallback(async () => {
    if (busyRef.current) return;
    const current = status;
    if (!current || platform?.supported === false) return;

    busyRef.current = true;
    setBusy(true);
    setError(null);

    try {
      const next = await setAwake(!current.active);
      setStatus(next);
      setNow(Date.now());
    } catch (cause) {
      setError(cause);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [platform?.supported, status]);

  const active = status?.active ?? false;
  const startedAt = status?.startedAtMs ?? null;
  const elapsedSeconds = active
    ? startedAt !== null
      ? Math.max(0, Math.floor((now - startedAt) / 1000))
      : (status?.elapsedSecs ?? 0)
    : 0;

  return {
    platform,
    status,
    active,
    elapsedSeconds,
    onBattery: status?.onBattery ?? false,
    busy,
    error,
    supported: platform?.supported ?? true,
    toggle,
    dismissError: () => setError(null),
  };
}
