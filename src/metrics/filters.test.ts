import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_FILTERS } from "../types.ts";
import { evaluateAccount, median, postsPerWeek } from "./filters.ts";

describe("median", () => {
  it("returns 0 for empty input", () => {
    assert.equal(median([]), 0);
  });

  it("ignores a viral outlier compared with the mean", () => {
    const values = [12_000, 14_000, 11_000, 1_200_000];
    assert.equal(median(values), 13_000);
  });
});

describe("postsPerWeek", () => {
  it("uses at least one day of span", () => {
    const t = 1_700_000_000;
    assert.ok(postsPerWeek([t, t + 3600]) > 1);
  });
});

describe("evaluateAccount", () => {
  const base = {
    username: "demo",
    nickname: "Demo",
    followers: 20_000,
    postCount: 20,
    slideshowCount: 16,
    slideshowShare: 0.8,
    medianViews: 40_000,
    viewsPerFollower: 2,
    postsPerWeek: 4,
    hashtags: ["wedding"],
  };

  it("passes a strong slideshow account", () => {
    const result = evaluateAccount(base, DEFAULT_FILTERS);
    assert.equal(result.verdict, "passed");
    assert.equal(result.margin, 0);
  });

  it("flags a near miss with the shortfall margin", () => {
    const result = evaluateAccount(
      { ...base, slideshowShare: 0.47 },
      DEFAULT_FILTERS,
    );
    assert.equal(result.verdict, "near_miss");
    assert.ok(result.margin > 0.05 && result.margin < 0.07);
  });

  it("fails a video-heavy account", () => {
    const result = evaluateAccount(
      { ...base, slideshowShare: 0.2, medianViews: 1000, viewsPerFollower: 0.05 },
      DEFAULT_FILTERS,
    );
    assert.equal(result.verdict, "failed");
  });
});
