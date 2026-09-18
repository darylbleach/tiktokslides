import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_FILTERS } from "../types.ts";
import { evaluateAccount } from "../metrics/filters.ts";
import {
  createJob,
  createSearch,
  getAccount,
  getJob,
  listLibrary,
  listMeasuredUsernames,
  nameFormat,
  openLibrary,
  resetDbForTests,
  updateJob,
  upsertAccount,
  upsertPosts,
} from "./library.ts";

describe("library", () => {
  const db = openLibrary(":memory:");
  resetDbForTests(db);

  const metrics = {
    username: "plannerjane",
    nickname: "Jane",
    followers: 20_000,
    postCount: 12,
    slideshowCount: 9,
    slideshowShare: 0.75,
    medianViews: 22_000,
    viewsPerFollower: 1.1,
    postsPerWeek: 3,
    hashtags: ["wedding", "seating"],
  };
  const judged = evaluateAccount(metrics, DEFAULT_FILTERS);

  it("stores accounts, posts, formats, and jobs", () => {
    const searchId = createSearch("wedding planning", "wedding");
    upsertAccount({
      ...metrics,
      verdict: judged.verdict,
      margin: judged.margin,
      measuredAt: new Date().toISOString(),
      searchId,
      signature: "UK wedding planner",
    });
    upsertPosts([
      {
        id: "99",
        username: "plannerjane",
        url: "https://www.tiktok.com/@plannerjane/photo/99",
        caption: "Guest list #wedding",
        views: 22000,
        likes: 400,
        isSlideshow: true,
        slideCount: 4,
        createTime: 1_700_000_000,
        hashtags: ["wedding"],
        coverUrl: null,
        imageUrls: ["https://cdn.example/1.jpg"],
      },
    ]);

    const listed = listLibrary({ niche: "wedding", verdict: "passed", minViews: 10_000 });
    assert.equal(listed.length, 1);
    assert.equal(listMeasuredUsernames().includes("plannerjane"), true);
    const account = getAccount("plannerjane");
    assert.equal(account?.posts.length, 1);
    assert.equal(account?.verdict, "passed");

    const format = nameFormat("Numbered guest-list hook", "Open with a number", ["99"]);
    assert.equal(format.name.includes("guest"), true);

    const job = createJob({ id: "job-1", type: "discovery", keywords: "wedding planning", target: 20 });
    assert.equal(job.status, "queued");
    const running = updateJob("job-1", { status: "running" });
    assert.equal(getJob("job-1")?.status, "running");
    assert.equal(running.progress.target, 20);
  });
});
