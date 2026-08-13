import { describe, expect, it } from "vitest";
import { calculateCourseProgress } from "./memberData";

describe("course progress calculation", () => {
  it("returns zero progress when a published course has no lessons", () => {
    expect(calculateCourseProgress(0, 0)).toEqual({ total: 0, completed: 0, percent: 0 });
  });

  it("rounds partial completion to a stable whole-number percentage", () => {
    expect(calculateCourseProgress(3, 1)).toEqual({ total: 3, completed: 1, percent: 33 });
  });

  it("reports a fully completed course at one hundred percent", () => {
    expect(calculateCourseProgress(8, 8)).toEqual({ total: 8, completed: 8, percent: 100 });
  });
});

