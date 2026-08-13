import { afterEach, describe, expect, it } from "vitest";
import {
  getDevelopmentCourseFixture,
  getDevelopmentMediaFixture,
  getDevelopmentTeachingFixture,
  isDevelopmentQaRequest,
  QA_MEDIA_ID,
} from "./qaFixtures";

const originalEnvironment = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnvironment;
});

describe("development-only responsive QA fixtures", () => {
  it("provides populated teaching, course, and media states during development", () => {
    process.env.NODE_ENV = "development";
    expect(isDevelopmentQaRequest()).toBe(true);
    expect(getDevelopmentTeachingFixture().assets).toHaveLength(1);
    expect(getDevelopmentCourseFixture().lessons).toHaveLength(3);
    expect(getDevelopmentMediaFixture(QA_MEDIA_ID)?.url).toContain("susan-website-pull.b-cdn.net");
  });

  it("never exposes the media fixture in production", () => {
    process.env.NODE_ENV = "production";
    expect(isDevelopmentQaRequest()).toBe(false);
    expect(getDevelopmentMediaFixture(QA_MEDIA_ID)).toBeNull();
  });
});
