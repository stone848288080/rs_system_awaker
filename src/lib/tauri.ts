import { invoke } from "@tauri-apps/api/core";
import type { AwakeStatus, PlatformInfo } from "../types";

/** 当前运行的防锁定状态与电池信息。 */
export const getStatus = () => invoke<AwakeStatus>("get_status");

/** 当前操作系统与功能支持情况。 */
export const getPlatform = () => invoke<PlatformInfo>("get_platform");

/** 开启 / 关闭防锁定，返回切换后的权威状态。 */
export const setAwake = (enabled: boolean) =>
  invoke<AwakeStatus>("set_awake", { enabled });

/** 是否正由电池供电（无电池设备恒为 false）。 */
export const isOnBattery = () => invoke<boolean>("is_on_battery");

/** 同步原生托盘菜单 / 提示语的语言。 */
export const setLanguage = (language: "en" | "zh") =>
  invoke<void>("set_language", { language });
