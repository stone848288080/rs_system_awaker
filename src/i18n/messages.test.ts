import { describe, expect, it } from "vitest";
import { en, messages, zh } from "./messages";

describe("i18n messages", () => {
  it("keeps English and Chinese keys in sync", () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
  });

  it("has no empty translations", () => {
    for (const language of ["en", "zh"] as const) {
      for (const [key, value] of Object.entries(messages[language])) {
        expect(value.trim(), `${language}.${key}`).not.toBe("");
      }
    }
  });

  it("contains the default English strings", () => {
    expect(messages.en["action.turnOn"]).toBe("Turn on sleep prevention");
    expect(messages.en["status.inactive.title"]).toBe(
      "Sleep prevention is off",
    );
  });
});
