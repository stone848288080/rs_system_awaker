//! Windows 实现：在独立线程中调用 `SetThreadExecutionState`。
//!
//! 该 API 的生效范围是“调用线程”，因此必须让一个线程持续存活并保持
//! `ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED` 状态；
//! 停止时由同一线程调用 `ES_CONTINUOUS` 恢复系统默认策略。

use std::sync::mpsc::{self, RecvTimeoutError, Sender};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use crate::error::AppError;
use windows::Win32::System::Power::{
    GetSystemPowerStatus, SetThreadExecutionState, ES_CONTINUOUS, ES_DISPLAY_REQUIRED,
    ES_SYSTEM_REQUIRED, SYSTEM_POWER_STATUS,
};

#[derive(Default)]
pub struct WindowsEngine {
    stop_tx: Option<Sender<()>>,
    handle: Option<JoinHandle<()>>,
}

impl WindowsEngine {
    pub fn start(&mut self) -> Result<(), AppError> {
        if self.handle.is_some() {
            return Ok(());
        }

        let (stop_tx, stop_rx) = mpsc::channel::<()>();
        let (ready_tx, ready_rx) = mpsc::sync_channel::<Result<(), AppError>>(0);

        let handle = thread::spawn(move || {
            let previous = unsafe {
                SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED)
            };

            if previous.0 == 0 {
                let error = std::io::Error::last_os_error();
                let _ = ready_tx.send(Err(AppError::with_detail(
                    "windows_power_api",
                    error.to_string(),
                )));
                return;
            }

            let _ = ready_tx.send(Ok(()));

            // 线程存活期间执行状态持续有效；停止信号或超时后重新检查。
            loop {
                match stop_rx.recv_timeout(Duration::from_secs(30)) {
                    Ok(()) | Err(RecvTimeoutError::Disconnected) => break,
                    Err(RecvTimeoutError::Timeout) => {}
                }
            }

            unsafe {
                SetThreadExecutionState(ES_CONTINUOUS);
            }
        });

        match ready_rx.recv_timeout(Duration::from_secs(3)) {
            Ok(Ok(())) => {
                self.stop_tx = Some(stop_tx);
                self.handle = Some(handle);
                Ok(())
            }
            Ok(Err(error)) => {
                let _ = handle.join();
                Err(error)
            }
            Err(_) => {
                let _ = stop_tx.send(());
                let _ = handle.join();
                Err(AppError::new("windows_thread_timeout"))
            }
        }
    }

    pub fn stop(&mut self) {
        if let Some(sender) = self.stop_tx.take() {
            let _ = sender.send(());
        }
        if let Some(handle) = self.handle.take() {
            let _ = handle.join();
        }
    }
}

impl Drop for WindowsEngine {
    fn drop(&mut self) {
        self.stop();
    }
}

/// `ACLineStatus`：0 = 电池，1 = 交流电，255 = 未知。
pub fn on_battery() -> bool {
    let mut status = unsafe { std::mem::zeroed::<SYSTEM_POWER_STATUS>() };
    let result = unsafe { GetSystemPowerStatus(&mut status) };
    result.is_ok() && status.ACLineStatus == 0
}
