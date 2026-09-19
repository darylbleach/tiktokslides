import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { slidesFor, waitForSlideReady } from "../src/studio/slide-html.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = path.join(root, "data", "drafts");
const cdp = process.env.SLIDE_RESEARCH_CDP_URL ?? "http://127.0.0.1:9222";

const posts = [
  {
    slug: "guest-list-dont-invite",
    layout: "numbered_list",
    eyebrow: "Guest list",
    headline: "You do not have to invite them",
    bullets: [
      "Your mum's colleague from\u00a02009",
      "A plus one for someone who is single and fine",
      "The cousin you have not seen since you were twelve",
      "Work people you would not grab a pint with",
      "Keep the list in Tie The Knot so the guilt edits stay in one place",
    ],
  },
  {
    slug: "seating-chart-after-rsvp",
    layout: "hook",
    eyebrow: "Table planner",
    headline: "The seating chart is not the first job",
    bullets: [
      "Lock the guest list and RSVPs first. Then sit people. Tie The Knot keeps both in one\u00a0list.",
    ],
  },
  {
    slug: "save-the-date-after-list",
    layout: "numbered_list",
    eyebrow: "Save the date",
    headline: "Do not send save the dates yet",
    bullets: [
      "If the names are still moving, the dates will too",
      "Write the must-invite list before the pretty stationery",
      "Plus ones belong in the list, not in a last-minute panic",
      "When the list is locked, send it. Tie The Knot is that list.",
    ],
  },
];

let browser;
let ownedBrowser = false;
try {
  browser = await chromium.connectOverCDP(cdp);
} catch {
  browser = await chromium.launch({ headless: true });
  ownedBrowser = true;
}
const context =
  browser.contexts()[0] ?? (await browser.newContext({ viewport: { width: 1080, height: 1920 } }));
const page = await context.newPage();
await page.setViewportSize({ width: 1080, height: 1920 });

try {
  for (const post of posts) {
    const dir = path.join(outRoot, post.slug);
    mkdirSync(dir, { recursive: true });
    const slides = slidesFor(post);
    for (const slide of slides) {
      await page.setContent(slide.html, { waitUntil: "networkidle" });
      await waitForSlideReady(page);
      await page.screenshot({
        path: path.join(dir, slide.name),
        type: "png",
        clip: { x: 0, y: 0, width: 1080, height: 1920 },
      });
    }
    writeFileSync(
      path.join(dir, "copy.json"),
      JSON.stringify(
        { headline: post.headline, bullets: post.bullets, layout: post.layout, eyebrow: post.eyebrow },
        null,
        2,
      ),
    );
    console.log(`rendered ${dir} (${slides.length} slides)`);
  }
} finally {
  await page.close();
  if (ownedBrowser) {
    await browser.close();
  }
}
