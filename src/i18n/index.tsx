import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { messages, type Language, type MessageKey } from "./messages";
import { setLanguage as setBackendLanguage } from "../lib/tauri";

const STORAGE_KEY = "keepawake.language";

export type Translate = (key: MessageKey) => string;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translate;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** 默认英文；只有用户明确切换到中文并持久化后才使用中文。 */
function initialLanguage(): Language {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "zh" ? "zh" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";

    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // localStorage 不可用时仍允许本次会话内切换。
    }

    // 同步原生托盘菜单；浏览器预览等非 Tauri 环境下忽略失败。
    if ("__TAURI_INTERNALS__" in window) {
      void setBackendLanguage(language).catch(() => undefined);
    }
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const t = useCallback<Translate>(
    (key) => messages[language][key] ?? messages.en[key],
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
