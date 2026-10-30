export type Language = "en" | "zh";

/**
 * 英文文案是唯一的 key 来源；新增文案时必须同时补齐中文，
 * 由 `Record<MessageKey, string>` 在编译期保证。
 */
export const en = {
  "app.tagline": "STAY AWAKE",
  "platform.detecting": "Detecting",
  "platform.supported": "Awake supported",
  "platform.unsupported": "Not supported",
  "status.loading.title": "Detecting system…",
  "status.loading.subtitle": "Reading the current sleep state",
  "status.active.title": "Sleep prevention is on",
  "status.active.subtitle": "Your system will stay awake while idle.",
  "status.inactive.title": "Sleep prevention is off",
  "status.inactive.subtitle":
    "Turn it on to prevent idle sleep and screen dimming.",
  "timer.label": "Awake for",
  "timer.idle": "Timer starts when enabled",
  "timer.loading": "Reading status",
  "action.turnOn": "Turn on sleep prevention",
  "action.turnOff": "Turn off sleep prevention",
  "action.switching": "Switching…",
  "action.unsupported": "Not supported on this platform",
  "battery.warning":
    "Running on battery. Keeping this on may drain the battery faster.",
  "limitations.prefix":
    "Only prevents idle sleep. Closing the lid on macOS and manual lock (",
  "limitations.suffix": ") still apply.",
  "footer": "Close the window to keep running in the tray · v0.1.0",
  "unsupported.notice": "KeepAwake currently supports Windows and macOS only.",
  "language.switch": "Switch language",
  "language.english": "English",
  "language.chinese": "Chinese",
  "error.dismiss": "Dismiss error",
  "error.generic": "Something went wrong. Please try again.",
  "error.unsupported": "Sleep prevention is not supported on this platform.",
  "error.caffeinateSpawn":
    "Could not start the macOS sleep-prevention helper.",
  "error.caffeinateExit":
    "The macOS sleep-prevention helper exited unexpectedly.",
  "error.caffeinateStatus":
    "Could not verify the macOS sleep-prevention helper.",
  "error.windowsApi": "Windows rejected the sleep-prevention request.",
  "error.windowsTimeout":
    "The Windows sleep-prevention thread did not start in time.",
  "error.unsupportedLanguage": "Unsupported language.",
} as const;

export type MessageKey = keyof typeof en;

export const zh: Record<MessageKey, string> = {
  "app.tagline": "STAY AWAKE",
  "platform.detecting": "检测中",
  "platform.supported": "支持防锁定",
  "platform.unsupported": "暂不支持",
  "status.loading.title": "正在检测系统…",
  "status.loading.subtitle": "正在读取当前防休眠状态",
  "status.active.title": "防锁定已开启",
  "status.active.subtitle": "系统空闲时保持唤醒，屏幕不会自动睡眠",
  "status.inactive.title": "防锁定已关闭",
  "status.inactive.subtitle": "开启后，系统空闲时不会自动睡眠或熄屏",
  "timer.label": "已保持唤醒",
  "timer.idle": "开启后自动计时",
  "timer.loading": "正在读取状态",
  "action.turnOn": "开启防锁定",
  "action.turnOff": "关闭防锁定",
  "action.switching": "正在切换…",
  "action.unsupported": "当前平台不支持",
  "battery.warning": "当前使用电池，长时间开启可能加速耗电。",
  "limitations.prefix": "仅阻止空闲睡眠；macOS 合盖、Windows ",
  "limitations.suffix": " 主动锁屏仍会生效。",
  "footer": "关闭窗口后驻留系统托盘 · v0.1.0",
  "unsupported.notice": "KeepAwake 目前仅支持 Windows 与 macOS。",
  "language.switch": "切换语言",
  "language.english": "英文",
  "language.chinese": "中文",
  "error.dismiss": "关闭错误提示",
  "error.generic": "操作失败，请稍后重试",
  "error.unsupported": "当前平台不支持防锁定功能。",
  "error.caffeinateSpawn": "无法启动 macOS 防休眠进程。",
  "error.caffeinateExit": "macOS 防休眠进程意外退出。",
  "error.caffeinateStatus": "无法确认 macOS 防休眠进程状态。",
  "error.windowsApi": "Windows 拒绝了防休眠请求。",
  "error.windowsTimeout": "Windows 防休眠线程启动超时。",
  "error.unsupportedLanguage": "不支持的语言。",
};

export const messages: Record<Language, Record<MessageKey, string>> = {
  en,
  zh,
};
