use std::sync::{Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;

use crate::error::AppError;
use crate::i18n::Language;
use crate::platform::{self, Engine};

/// 前端所需的权威状态快照。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AwakeStatus {
    pub active: bool,
    pub started_at_ms: Option<u64>,
    pub elapsed_secs: u64,
    pub on_battery: bool,
}

#[derive(Default)]
pub struct AppState {
    inner: Mutex<Session>,
}

#[derive(Default)]
struct Session {
    active: bool,
    started_at_ms: Option<u64>,
    engine: Engine,
    language: Language,
}

impl AppState {
    fn lock(&self) -> MutexGuard<'_, Session> {
        self.inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    pub fn is_active(&self) -> bool {
        self.lock().active
    }

    /// 开启防锁定；重复调用保持幂等。
    pub fn start(&self) -> Result<(), AppError> {
        let mut session = self.lock();
        if session.active {
            return Ok(());
        }

        session.engine.start()?;
        session.active = true;
        session.started_at_ms = Some(now_ms());
        Ok(())
    }

    /// 关闭防锁定并恢复系统策略；重复调用保持幂等。
    pub fn stop(&self) {
        let mut session = self.lock();
        session.engine.stop();
        session.active = false;
        session.started_at_ms = None;
    }

    pub fn language(&self) -> Language {
        self.lock().language
    }

    pub fn set_language(&self, language: Language) {
        self.lock().language = language;
    }

    pub fn status(&self) -> AwakeStatus {
        // pmset 可能有几十毫秒延迟，放在锁外读取以免阻塞切换操作。
        let on_battery = platform::on_battery();
        let session = self.lock();
        let elapsed_secs = session
            .started_at_ms
            .map(|started| now_ms().saturating_sub(started) / 1000)
            .unwrap_or(0);

        AwakeStatus {
            active: session.active,
            started_at_ms: session.started_at_ms,
            elapsed_secs,
            on_battery,
        }
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[cfg(any(target_os = "macos", target_os = "windows"))]
    #[test]
    fn start_stop_tracks_elapsed_time() {
        let state = AppState::default();
        assert!(!state.is_active());
        assert_eq!(state.language(), Language::English);
        state.set_language(Language::Chinese);
        assert_eq!(state.language(), Language::Chinese);
        state.set_language(Language::English);

        state.start().expect("engine should start");
        let running = state.status();
        assert!(running.active);
        assert!(running.started_at_ms.is_some());

        std::thread::sleep(Duration::from_millis(1_100));
        assert!(state.status().elapsed_secs >= 1);

        state.stop();
        let stopped = state.status();
        assert!(!stopped.active);
        assert!(stopped.started_at_ms.is_none());
        assert_eq!(stopped.elapsed_secs, 0);

        // 幂等：重复开启/关闭不应报错或产生额外进程。
        state.start().expect("restart should succeed");
        state.stop();
        state.stop();
        assert!(!state.is_active());
    }
}
