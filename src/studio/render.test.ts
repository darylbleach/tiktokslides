import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSlideHtml, slidesFor } from "./render.ts";

describe("slidesFor", () => {
  it("builds a single hook slide", () => {
    const slides = slidesFor({
      headline: "Your seating chart is lying to you",
      bullets: ["Start with who must sit together"],
      layout: "hook",
    });
    assert.equal(slides.length, 1);
    assert.match(slides[0]!.html, /Your seating chart is lying to you/);
    assert.match(slides[0]!.html, /Tie The Knot/);
    assert.match(slides[0]!.html, /Playfair Display/);
    assert.match(slides[0]!.html, /#F7F4EF/);
  });

  it("builds a cover plus numbered slides", () => {
    const slides = slidesFor({
      headline: "Guest list rules",
      bullets: ["Plus-ones last", "Kids table is a trap"],
      layout: "numbered_list",
    });
    assert.equal(slides.length, 3);
    assert.match(slides[0]!.html, /Guest list rules/);
    assert.doesNotMatch(slides[0]!.html, />List</);
    assert.match(slides[1]!.html, />01</);
    assert.match(slides[1]!.html, /Plus-ones last/);
    assert.match(slides[2]!.html, /Kids table is a trap/);
  });
});

describe("buildSlideHtml", () => {
  it("escapes copy", () => {
    const html = buildSlideHtml("<script>", "a & b");
    assert.equal(html.includes("<script>"), false);
    assert.match(html, /&lt;script&gt;/);
  });
});
