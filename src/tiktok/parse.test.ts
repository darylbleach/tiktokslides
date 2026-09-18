import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectFromUnknown, isSlideshowItem, mergeCollected, parseRehydration, parseSigiState } from "./parse.ts";

describe("isSlideshowItem", () => {
  it("detects imagePost payloads", () => {
    assert.equal(isSlideshowItem({ imagePost: { images: [] } }), true);
    assert.equal(isSlideshowItem({ video: { playAddr: "x" } }), false);
  });
});

describe("collectFromUnknown", () => {
  it("walks nested itemList and user blobs", () => {
    const { posts, accounts } = collectFromUnknown({
      data: {
        itemList: [
          {
            id: "123",
            desc: "Seating chart tips #wedding",
            createTime: 1700000000,
            author: { uniqueId: "plannerjane", nickname: "Jane" },
            stats: { playCount: 120000, diggCount: 4000 },
            imagePost: {
              images: [{ imageURL: { urlList: ["https://cdn.example/1.jpg"] } }],
            },
          },
        ],
        userInfo: {
          user: { uniqueId: "plannerjane", nickname: "Jane" },
          stats: { followerCount: 88000 },
        },
      },
    });
    assert.equal(posts.length, 1);
    assert.equal(posts[0]?.isSlideshow, true);
    assert.equal(posts[0]?.hashtags.includes("wedding"), true);
    assert.equal(accounts[0]?.followers, 88000);
  });
});

describe("parseRehydration", () => {
  it("reads the rehydration script tag", () => {
    const html =
      '<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">{"ok":true}</script></html>';
    assert.deepEqual(parseRehydration(html), { ok: true });
  });
});

describe("parseSigiState", () => {
  it("reads SIGI_STATE", () => {
    const html = '<html><script id="SIGI_STATE">{"ItemModule":{}}</script></html>';
    assert.deepEqual(parseSigiState(html), { ItemModule: {} });
  });
});

describe("mergeCollected", () => {
  it("keeps the richer post and higher follower count", () => {
    const first = collectFromUnknown({
      id: "1",
      author: { uniqueId: "a" },
      stats: { playCount: 10 },
    });
    const second = collectFromUnknown({
      id: "1",
      author: { uniqueId: "a" },
      stats: { playCount: 99 },
      imagePost: { images: [{ imageURL: { urlList: ["https://cdn.example/1.jpg"] } }] },
    });
    const merged = mergeCollected(first, second);
    assert.equal(merged.posts[0]?.views, 99);
    assert.equal(merged.posts[0]?.imageUrls.length, 1);
  });
});
