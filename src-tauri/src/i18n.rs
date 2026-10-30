use serde::Serialize;

/// 应用界面语言。默认英文，与前端首次启动行为一致。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    #[default]
    English,
    Chinese,
}

#[derive(Debug, Clone, Copy)]
pub struct TrayText {
    pub show: &'static str,
    pub toggle_on: &'static str,
    pub toggle_off: &'static str,
    pub quit: &'static str,
    pub tooltip_on: &'static str,
    pub tooltip_off: &'static str,
}

impl TrayText {
    pub fn toggle(self, active: bool) -> &'static str {
        if active {
            self.toggle_on
        } else {
            self.toggle_off
        }
    }

    pub fn tooltip(self, active: bool) -> &'static str {
        if active {
            self.tooltip_on
        } else {
            self.tooltip_off
        }
    }
}

impl Language {
    pub fn parse(value: &str) -> Option<Self> {
        match value.trim().to_ascii_lowercase().as_str() {
            "en" | "en-us" | "en_us" => Some(Self::English),
            "zh" | "zh-cn" | "zh_cn" => Some(Self::Chinese),
            _ => None,
        }
    }

    pub fn tray(self) -> TrayText {
        match self {
            Self::English => TrayText {
                show: "Show KeepAwake",
                toggle_on: "Turn Off Sleep Prevention",
                toggle_off: "Turn On Sleep Prevention",
                quit: "Quit KeepAwake",
                tooltip_on: "KeepAwake · Sleep prevention on",
                tooltip_off: "KeepAwake · Sleep prevention off",
            },
            Self::Chinese => TrayText {
                show: "显示主界面",
                toggle_on: "关闭防锁定",
                toggle_off: "开启防锁定",
                quit: "退出 KeepAwake",
                tooltip_on: "KeepAwake · 防锁定已开启",
                tooltip_off: "KeepAwake · 防锁定已关闭",
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_to_english() {
        assert_eq!(Language::default(), Language::English);
        assert_eq!(
            Language::default().tray().toggle_off,
            "Turn On Sleep Prevention"
        );
    }

    #[test]
    fn parses_language_codes() {
        assert_eq!(Language::parse("en"), Some(Language::English));
        assert_eq!(Language::parse("EN-US"), Some(Language::English));
        assert_eq!(Language::parse("zh"), Some(Language::Chinese));
        assert_eq!(Language::parse("zh-CN"), Some(Language::Chinese));
        assert_eq!(Language::parse("fr"), None);
    }

    #[test]
    fn tray_text_follows_language_and_state() {
        let english = Language::English.tray();
        assert_eq!(english.toggle(false), "Turn On Sleep Prevention");
        assert_eq!(english.toggle(true), "Turn Off Sleep Prevention");
        assert_eq!(english.tooltip(true), "KeepAwake · Sleep prevention on");

        let chinese = Language::Chinese.tray();
        assert_eq!(chinese.show, "显示主界面");
        assert_eq!(chinese.toggle(false), "开启防锁定");
        assert_eq!(chinese.tooltip(false), "KeepAwake · 防锁定已关闭");
    }
}
