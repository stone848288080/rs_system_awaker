import { describe, expect, it } from "vitest";
import { formatDuration } from "./format";

describe("formatDuration", () => {
  it("pads zero to HH:MM:SS", () => {
    expect(formatDuration(0)).toBe("00:00:00");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(59)).toBe("00:00:59");
    expect(formatDuration(61)).toBe("00:01:01");
    expect(formatDuration(3599)).toBe("00:59:59");
  });

  it("formats hours and multi-digit hours", () => {
    expect(formatDuration(3600)).toBe("01:00:00");
    expect(formatDuration(86_399)).toBe("23:59:59");
    expect(formatDuration(100 * 3600)).toBe("100:00:00");
  });

  it("clamps invalid input to zero", () => {
    expect(formatDuration(-5)).toBe("00:00:00");
    expect(formatDuration(Number.NaN)).toBe("00:00:00");
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("00:00:00");
  });

  it("floors fractions of a second", () => {
    expect(formatDuration(1.99)).toBe("00:00:01");
  });
});
