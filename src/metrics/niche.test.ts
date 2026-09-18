import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchNiche } from "./niche.ts";

describe("matchNiche", () => {
  it("accepts a bride-club bio and wedding captions", () => {
    const match = matchNiche({
      username: "the.bride.club",
      nickname: "the.bride.club",
      signature: "Helping DIY brides know what to do next. Wedding tips without overwhelm.",
      captions: ["Wedding week gets chaotic FAST", "Invite who you actually want there"],
      hashtags: ["weddingplanning", "bridetobe"],
      keywords: "wedding planning",
    });
    assert.equal(match.relevant, true);
    assert.equal(match.farm, false);
    assert.ok(match.hits.includes("bride") || match.hits.includes("wedding"));
  });

  it("rejects bike/daily captions with no wedding signal", () => {
    const match = matchNiche({
      username: "bikeridedaily",
      nickname: "bikeridedaily",
      signature: "Daily rides and gear",
      captions: ["morning ride with the crew", "new saddle day #cycling"],
      hashtags: ["cycling", "bike"],
      keywords: "wedding planning",
    });
    assert.equal(match.relevant, false);
    assert.equal(match.score, 0);
  });

  it("rejects a generated slideshow farm that only spam-hashtags wedding", () => {
    const match = matchNiche({
      username: "swillilm09g",
      nickname: "Emily Williams",
      signature: "Download POV in the App Store",
      captions: [
        "I love this so much 🥹 #marriage #weddinginspo #wedding",
        "I love this so much 🥹 #marriage #weddinginspo #wedding",
        "I love this idea so much 🥹 #wedding #weddingideas",
      ],
      hashtags: ["marriage", "weddinginspo", "wedding"],
      keywords: "wedding planning",
    });
    assert.equal(match.farm, true);
    assert.equal(match.relevant, false);
  });

  it("uses the search keywords themselves as niche terms", () => {
    const match = matchNiche({
      username: "plannerjane",
      nickname: "Jane",
      signature: "Seating charts for anxious hosts",
      captions: ["How I build a seating chart without a fight"],
      hashtags: ["seatingchart"],
      keywords: "seating chart",
    });
    assert.equal(match.relevant, true);
    assert.ok(match.hits.some((hit) => hit.includes("seating")));
  });

  it("does not treat generic planning/mom/fitness language as wedding", () => {
    const match = matchNiche({
      username: "medicalmama_",
      nickname: "E",
      signature: "raising kids, raising hell, counting carbs",
      captions: ["My children are my life #motherhood #planning"],
      hashtags: ["toddlersoftiktok", "momlife", "planning"],
      keywords: "wedding planning",
    });
    assert.equal(match.relevant, false);
  });

  it("rejects the third-run false passes", () => {
    const falsePasses = [
      { username: "medicalmama_", signature: "raising kids, raising hell", hashtags: ["toddlersoftiktok"] },
      { username: "itxmickey11", signature: "90s baby", hashtags: [] },
      { username: "itsmichaelhenderson", signature: "Relax it's not that serious", hashtags: ["fyp", "wife"] },
      { username: "throughamothersey", signature: "Honest truths that most moms can relate to.", hashtags: ["motherhood"] },
      { username: "levi.grifhorst", signature: "Follower of Christ", hashtags: ["jesuschrist"] },
      { username: "quinnspam94", signature: "not my photos", hashtags: ["fyp", "hockey"] },
      { username: "secretacc345667847", signature: "", hashtags: ["fyp", "boyfriend"] },
    ];
    for (const account of falsePasses) {
      const match = matchNiche({ ...account, captions: [], keywords: "wedding planning" });
      assert.equal(match.relevant, false, `@${account.username} should be off-niche`);
    }
  });
});
