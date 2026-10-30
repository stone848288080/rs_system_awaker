import type { MessageKey } from "../i18n/messages";

export interface BackendError {
  code: string;
  detail?: string | null;
}

const BACKEND_ERROR_KEYS: Record<string, MessageKey> = {
  unsupported_platform: "error.unsupported",
  caffeinate_spawn: "error.caffeinateSpawn",
  caffeinate_exit: "error.caffeinateExit",
  caffeinate_status: "error.caffeinateStatus",
  windows_power_api: "error.windowsApi",
  windows_thread_timeout: "error.windowsTimeout",
  unsupported_language: "error.unsupportedLanguage",
};

type Translator = (key: MessageKey) => string;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isBackendError(value: unknown): value is BackendError {
  return isRecord(value) && typeof value.code === "string";
}

/**
 * 把后端错误码、原始字符串或 JS 异常统一转成当前语言的展示文案。
 * 错误码映射不依赖语言，因此切换语言后已有错误提示也会重新翻译。
 */
export function describeError(error: unknown, t: Translator): string {
  if (isBackendError(error)) {
    const key = BACKEND_ERROR_KEYS[error.code];
    return key ? t(key) : t("error.generic");
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t("error.generic");
}
