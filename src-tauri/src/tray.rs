use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Wry};

use crate::i18n::Language;
use crate::state::{AppState, AwakeStatus};

const TRAY_ID: &str = "keepawake-tray";
const ICON_IDLE: &[u8] = include_bytes!("../icons/tray-idle.png");
const ICON_ACTIVE: &[u8] = include_bytes!("../icons/tray-active.png");

pub struct TrayHandles {
    show: MenuItem<Wry>,
    toggle: MenuItem<Wry>,
    quit: MenuItem<Wry>,
}

/// 初始化系统托盘：显示主界面 / 动态开关 / 退出。
/// 原生菜单默认英文，前端恢复已保存语言后会调用 `set_language` 同步。
pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let text = Language::English.tray();
    let show = MenuItem::with_id(app, "show", text.show, true, None::<&str>)?;
    let toggle = MenuItem::with_id(app, "toggle", text.toggle(false), true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", text.quit, true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &toggle, &separator, &quit])?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(load_icon(false)?)
        .icon_as_template(false)
        .tooltip(text.tooltip(false))
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_main_window(app),
            "toggle" => toggle_from_tray(app),
            "quit" => {
                // 先恢复系统策略，再退出事件循环。
                crate::shutdown(app);
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    app.manage(TrayHandles { show, toggle, quit });
    Ok(())
}

fn toggle_from_tray(app: &AppHandle) {
    let state = app.state::<AppState>();
    let enabled = !state.is_active();

    if let Err(error) = crate::commands::apply_awake(app, &state, enabled) {
        // 托盘操作没有返回值可用，失败时推送结构化错误并唤起主窗口展示。
        let _ = app.emit("awake-error", &error);
        show_main_window(app);
    }
}

/// 根据状态切换托盘图标、提示语与菜单文案（语言取自 AppState）。
pub fn sync(app: &AppHandle, status: &AwakeStatus) {
    let language = app.state::<AppState>().language();
    update_menu(app, language, status.active);
    update_tooltip(app, language, status.active);

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        if let Ok(icon) = load_icon(status.active) {
            let _ = tray.set_icon(Some(icon));
        }
    }
}

/// 语言切换时更新原生菜单与提示语，不改变图标。
pub fn sync_language(app: &AppHandle, language: Language) {
    let active = app.state::<AppState>().is_active();
    update_menu(app, language, active);
    update_tooltip(app, language, active);
}

fn update_menu(app: &AppHandle, language: Language, active: bool) {
    let Some(handles) = app.try_state::<TrayHandles>() else {
        return;
    };
    let text = language.tray();
    let _ = handles.show.set_text(text.show);
    let _ = handles.toggle.set_text(text.toggle(active));
    let _ = handles.quit.set_text(text.quit);
}

fn update_tooltip(app: &AppHandle, language: Language, active: bool) {
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let _ = tray.set_tooltip(Some(language.tray().tooltip(active)));
    }
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn load_icon(active: bool) -> tauri::Result<Image<'static>> {
    Image::from_bytes(if active { ICON_ACTIVE } else { ICON_IDLE })
}
