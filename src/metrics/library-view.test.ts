import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_FILTERS } from "../types.ts";
import { decorateLibraryAccount, formatLibraryTable } from "./library-view.ts";

describe("library view", () => {
  const base = {
    username: "the.bride.club",
    nickname: "the.bride.club",
    followers: 12_000,
    postCount: 30,
    slideshowCount: 30,
    slideshowShare: 1,
    medianViews: 2956,
    viewsPerFollower: 0.2463,
    postsPerWeek: 20.532,
    hashtags: ["wedding"],
    verdict: "failed" as const,
    margin: 0.7,
    measuredAt: "2026-09-18T21:59:59.082Z",
    searchId: 1,
    signature: "",
  };

  it("rescores a stored fail against current wedding defaults", () => {
    const row = decorateLibraryAccount(base, DEFAULT_FILTERS);
    assert.equal(row.verdict, "passed");
    assert.deepEqual(row.missed, []);
  });

  it("names the constraint that missed", () => {
    const row = decorateLibraryAccount(
      { ...base, username: "oh.so.weddings", slideshowShare: 0.6, medianViews: 968, viewsPerFollower: 3.67, postsPerWeek: 5.5 },
      DEFAULT_FILTERS,
    );
    assert.equal(row.verdict, "near_miss");
    assert.equal(row.missed[0], "median 968<1000");
  });

  it("prints a readable table", () => {
    const text = formatLibraryTable([decorateLibraryAccount(base)]);
    assert.match(text, /@the\.bride\.club/);
    assert.match(text, /passed/);
    assert.match(text, /share=1\.00/);
    assert.match(text, /1 passed, 0 near-miss, 0 failed/);
  });
});
