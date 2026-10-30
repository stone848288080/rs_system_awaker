export type PlatformOs = "windows" | "macos" | "unsupported";

export interface PlatformInfo {
  os: PlatformOs;
  displayName: string;
  emoji: string;
  supported: boolean;
}

export interface AwakeStatus {
  active: boolean;
  startedAtMs: number | null;
  elapsedSecs: number;
  onBattery: boolean;
}
