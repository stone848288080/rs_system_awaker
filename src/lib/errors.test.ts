import { describe, expect, it } from "vitest";
import { describeError, isBackendError } from "./errors";
import type { MessageKey } from "../i18n/messages";

/** 测试用翻译器：直接返回 key，便于断言命中了哪条文案。 */
const t = (key: MessageKey) => key;

describe("describeError", () => {
  it("maps backend error codes to localized keys", () => {
    expect(describeError({ code: "unsupported_platform" }, t)).toBe(
      "error.unsupported",
    );
    expect(describeError({ code: "caffeinate_spawn", detail: "EPERM" }, t)).toBe(
      "error.caffeinateSpawn",
    );
    expect(describeError({ code: "windows_power_api" }, t)).toBe(
      "error.windowsApi",
    );
  });

  it("falls back for unknown backend codes", () => {
    expect(describeError({ code: "something_new" }, t)).toBe("error.generic");
  });

  it("keeps raw strings and Error messages", () => {
    expect(describeError("native failure", t)).toBe("native failure");
    expect(describeError(new Error("boom"), t)).toBe("boom");
  });

  it("handles empty and unknown values", () => {
    expect(describeError(null, t)).toBe("error.generic");
    expect(describeError("", t)).toBe("error.generic");
    expect(describeError({}, t)).toBe("error.generic");
  });
});

describe("isBackendError", () => {
  it("detects serialized backend errors", () => {
    expect(isBackendError({ code: "unsupported_platform" })).toBe(true);
    expect(isBackendError({ detail: "no code" })).toBe(false);
    expect(isBackendError("raw")).toBe(false);
  });
});
