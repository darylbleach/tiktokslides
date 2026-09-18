import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TikTokAccount, TikTokPost } from "../types.ts";
import { selectDiscoveryCandidates } from "./candidates.ts";

function account(username: string, followers = 0): TikTokAccount {
  return { username, nickname: username, followers, signature: "" };
}

function post(username: string, isSlideshow: boolean, id = `${username}-${isSlideshow ? "s" : "v"}`): TikTokPost {
  return {
    id,
    username,
    url: `https://www.tiktok.com/@${username}/photo/${id}`,
    caption: "",
    views: 1000,
    likes: 10,
    isSlideshow,
    slideCount: isSlideshow ? 4 : 0,
    createTime: 1_700_000_000,
    hashtags: [],
    coverUrl: null,
    imageUrls: [],
  };
}

describe("selectDiscoveryCandidates", () => {
  it("prefers slideshow authors and skips Top-tab junk", () => {
    const selected = selectDiscoveryCandidates(
      [account("the.bride.club", 12000), account("bikeridedaily"), account("emmajdeakin", 4570)],
      [post("the.bride.club", true), post("emmajdeakin", false, "e1"), post("emmajdeakin", false, "e2")],
      new Set(),
    );
    assert.deepEqual(
      selected.preferred.map((item) => item.username),
      ["the.bride.club"],
    );
    assert.deepEqual(selected.fallback, []);
    assert.equal(selected.skipped.some((item) => item.username === "bikeridedaily" && item.reason === "no_posts"), true);
    assert.equal(selected.skipped.some((item) => item.username === "emmajdeakin" && item.reason === "video_only"), true);
  });

  it("keeps a single search video as fallback so mixed profiles are not dropped", () => {
    const selected = selectDiscoveryCandidates(
      [account("the.bride.club")],
      [post("the.bride.club", false)],
      new Set(),
    );
    assert.deepEqual(selected.preferred, []);
    assert.deepEqual(
      selected.fallback.map((item) => item.username),
      ["the.bride.club"],
    );
  });

  it("treats photo-tab authors as slideshow evidence", () => {
    const selected = selectDiscoveryCandidates([account("plannerjane")], [], new Set(), ["plannerjane"]);
    assert.deepEqual(
      selected.preferred.map((item) => item.username),
      ["plannerjane"],
    );
  });

  it("omits usernames already seen", () => {
    const selected = selectDiscoveryCandidates(
      [account("wedli0")],
      [post("wedli0", true)],
      new Set(["wedli0"]),
    );
    assert.deepEqual(selected.preferred, []);
    assert.equal(selected.skipped[0]?.reason, "seen");
  });

  it("skips off-niche photo authors when keywords are set", () => {
    const weddingPost = {
      ...post("the.bride.club", true),
      caption: "Wedding week gets chaotic",
      hashtags: ["weddingplanning"],
    };
    const bikePost = {
      ...post("bikeridedaily", true),
      caption: "morning ride with the crew",
      hashtags: ["cycling"],
    };
    const selected = selectDiscoveryCandidates(
      [account("the.bride.club", 12000), account("bikeridedaily")],
      [weddingPost, bikePost],
      new Set(),
      [],
      { keywords: "wedding planning" },
    );
    assert.deepEqual(
      selected.preferred.map((item) => item.username),
      ["the.bride.club"],
    );
    assert.equal(selected.skipped.some((item) => item.username === "bikeridedaily" && item.reason === "off_niche"), true);
  });
});
