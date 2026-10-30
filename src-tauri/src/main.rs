#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod error;
mod i18n;
mod platform;
mod state;
mod tray;

use state::AppState;
use tauri::{Manager, WindowEvent};

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .setup(|app| {
            tray::setup(app.handle())?;

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }

            Ok(())
        })
        // 点击“X”只隐藏窗口，应用继续驻留系统托盘。
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_platform,
            commands::get_status,
            commands::set_awake,
            commands::is_on_battery,
            commands::set_language
        ])
        .build(tauri::generate_context!())
        .expect("failed to initialize KeepAwake")
        .run(|app_handle, event| match event {
            tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
                shutdown(app_handle);
            }
            #[cfg(target_os = "macos")]
            tauri::RunEvent::Reopen { .. } => {
                // 窗口被隐藏后点击 Dock 图标，重新显示主界面。
                tray::show_main_window(app_handle);
            }
            _ => {}
        });
}

/// 所有退出路径的兜底清理：终止 caffeinate / 恢复 Windows 执行状态。
fn shutdown(app: &tauri::AppHandle) {
    if let Some(state) = app.try_state::<AppState>() {
        state.stop();
    }
}
