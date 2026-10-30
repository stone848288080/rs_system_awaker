use tauri::{AppHandle, Emitter, State};

use crate::error::AppError;
use crate::i18n::Language;
use crate::platform::{self, PlatformInfo};
use crate::state::{AppState, AwakeStatus};
use crate::tray;

#[tauri::command]
pub fn get_platform() -> PlatformInfo {
    PlatformInfo::current()
}

#[tauri::command]
pub fn get_status(state: State<'_, AppState>) -> AwakeStatus {
    state.status()
}

#[tauri::command]
pub fn set_awake(
    enabled: bool,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<AwakeStatus, AppError> {
    apply_awake(&app, &state, enabled)
}

#[tauri::command]
pub fn is_on_battery() -> bool {
    platform::on_battery()
}

/// 切换界面语言：保存到状态并同步原生托盘菜单。
#[tauri::command]
pub fn set_language(
    language: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let language =
        Language::parse(&language).ok_or_else(|| AppError::new("unsupported_language"))?;

    state.set_language(language);
    tray::sync_language(&app, language);
    Ok(())
}

/// 托盘菜单与 IPC 共用的切换逻辑：
/// 更新引擎与计时 → 同步托盘图标/文案 → 广播状态事件。
pub fn apply_awake(
    app: &AppHandle,
    state: &AppState,
    enabled: bool,
) -> Result<AwakeStatus, AppError> {
    if !PlatformInfo::current().supported {
        return Err(AppError::new("unsupported_platform"));
    }

    if enabled {
        state.start()?;
    } else {
        state.stop();
    }

    let status = state.status();
    tray::sync(app, &status);
    let _ = app.emit("awake-state-changed", &status);
    Ok(status)
}
