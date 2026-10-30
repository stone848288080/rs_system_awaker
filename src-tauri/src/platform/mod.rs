//! 平台检测与防休眠路由。
//!
//! 仅使用系统原生机制：
//! - Windows：`SetThreadExecutionState`（Win32 电源管理 API）
//! - macOS：系统自带 `caffeinate` 进程
//!
//! 不模拟鼠标/键盘输入，避免干扰用户正在进行的游戏或会议。

use serde::Serialize;

use crate::error::AppError;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "windows")]
mod windows;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
#[allow(dead_code)] // 变体由目标平台条件编译构造
pub enum OperatingSystem {
    Windows,
    Macos,
    Unsupported,
}

/// 返回给前端的系统信息。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformInfo {
    pub os: OperatingSystem,
    pub display_name: &'static str,
    pub emoji: &'static str,
    pub supported: bool,
}

impl PlatformInfo {
    pub fn current() -> Self {
        #[cfg(target_os = "windows")]
        {
            Self {
                os: OperatingSystem::Windows,
                display_name: "Windows",
                emoji: "🪟",
                supported: true,
            }
        }

        #[cfg(target_os = "macos")]
        {
            Self {
                os: OperatingSystem::Macos,
                display_name: "macOS",
                emoji: "🍎",
                supported: true,
            }
        }

        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        {
            Self {
                os: OperatingSystem::Unsupported,
                display_name: "Unsupported",
                emoji: "💻",
                supported: false,
            }
        }
    }
}

/// 当前是否由电池供电。读取失败时返回 `false`，避免误报。
pub fn on_battery() -> bool {
    #[cfg(target_os = "macos")]
    {
        macos::on_battery()
    }

    #[cfg(target_os = "windows")]
    {
        windows::on_battery()
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        false
    }
}

/// 按平台路由的防休眠引擎。`Drop` 时会再次确保策略被恢复。
#[derive(Default)]
pub struct Engine {
    #[cfg(target_os = "macos")]
    inner: macos::MacosEngine,
    #[cfg(target_os = "windows")]
    inner: windows::WindowsEngine,
}

impl Engine {
    pub fn start(&mut self) -> Result<(), AppError> {
        #[cfg(target_os = "macos")]
        {
            self.inner.start()
        }

        #[cfg(target_os = "windows")]
        {
            self.inner.start()
        }

        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        {
            Err(AppError::new("unsupported_platform"))
        }
    }

    pub fn stop(&mut self) {
        #[cfg(any(target_os = "windows", target_os = "macos"))]
        self.inner.stop();
    }
}

impl Drop for Engine {
    fn drop(&mut self) {
        self.stop();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reports_the_current_platform() {
        let info = PlatformInfo::current();
        #[cfg(target_os = "macos")]
        {
            assert_eq!(info.os, OperatingSystem::Macos);
            assert_eq!(info.display_name, "macOS");
            assert!(info.supported);
        }
        #[cfg(target_os = "windows")]
        {
            assert_eq!(info.os, OperatingSystem::Windows);
            assert_eq!(info.display_name, "Windows");
            assert!(info.supported);
        }
    }
}
