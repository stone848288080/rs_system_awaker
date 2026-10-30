//! macOS 实现：拉起系统自带的 `caffeinate` 子进程。
//!
//! `caffeinate -dis` 分别阻止显示器休眠、空闲睡眠与系统睡眠；`-w <pid>`
//! 让 caffeinate 等待本进程退出，即使应用崩溃也不会遗留防休眠进程。

use std::io::Read;
use std::process::{Child, Command, Stdio};
use std::time::Duration;

use crate::error::AppError;

const CAFFEINATE: &str = "/usr/bin/caffeinate";
const PMS: &str = "/usr/bin/pmset";

#[derive(Default)]
pub struct MacosEngine {
    child: Option<Child>,
}

impl MacosEngine {
    pub fn start(&mut self) -> Result<(), AppError> {
        // 已处于运行状态时保持幂等；若进程意外退出则重新拉起。
        if let Some(child) = self.child.as_mut() {
            match child.try_wait() {
                Ok(None) => return Ok(()),
                Ok(Some(_)) | Err(_) => {
                    self.child = None;
                }
            }
        }

        let pid = std::process::id().to_string();
        let mut child = Command::new(CAFFEINATE)
            .args(["-dis", "-w", pid.as_str()])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|error| AppError::with_detail("caffeinate_spawn", error.to_string()))?;

        // 参数错误或系统拒绝时 caffeinate 会立即退出，做一次快速健康检查。
        std::thread::sleep(Duration::from_millis(40));
        match child.try_wait() {
            Ok(Some(status)) => {
                let mut detail = String::new();
                if let Some(mut stderr) = child.stderr.take() {
                    let _ = stderr.read_to_string(&mut detail);
                }
                let detail = detail.trim();
                if detail.is_empty() {
                    Err(AppError::with_detail(
                        "caffeinate_exit",
                        format!("exited immediately ({status})"),
                    ))
                } else {
                    Err(AppError::with_detail("caffeinate_exit", detail))
                }
            }
            Ok(None) => {
                self.child = Some(child);
                Ok(())
            }
            Err(error) => {
                let _ = child.kill();
                let _ = child.wait();
                Err(AppError::with_detail(
                    "caffeinate_status",
                    error.to_string(),
                ))
            }
        }
    }

    pub fn stop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

impl Drop for MacosEngine {
    fn drop(&mut self) {
        self.stop();
    }
}

/// `pmset -g batt` 的固定输出以 `'AC Power'` 或 `'Battery Power'` 标记电源来源。
pub fn on_battery() -> bool {
    match Command::new(PMS).args(["-g", "batt"]).output() {
        Ok(output) => parse_battery_output(&String::from_utf8_lossy(&output.stdout)),
        Err(_) => false,
    }
}

fn parse_battery_output(output: &str) -> bool {
    output.contains("Battery Power")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_ac_power() {
        let output = "Now drawing from 'AC Power'\n -InternalBattery-0 (id=1)\t98%; charged; 0:00 remaining present: true";
        assert!(!parse_battery_output(output));
    }

    #[test]
    fn detects_battery_power() {
        let output = "Now drawing from 'Battery Power'\n -InternalBattery-0 (id=1)\t68%; discharging; 4:12 remaining present: true";
        assert!(parse_battery_output(output));
    }

    #[test]
    fn starts_and_stops_caffeinate() {
        let mut engine = MacosEngine::default();
        engine.start().expect("caffeinate should start");
        std::thread::sleep(Duration::from_millis(80));
        engine.stop();
    }
}
