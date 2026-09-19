import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { slidesFor, waitForSlideReady } from "../src/studio/slide-html.mjs";
import {
  TTK_SLIDE_PHOTOS,
  creditFor,
  ensurePhoto,
  photoDataUri,
  UNSPLASH_PHOTOS,
} from "../src/studio/unsplash-photos.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = path.join(root, "data", "drafts");
const cdp = process.env.SLIDE_RESEARCH_CDP_URL ?? "http://127.0.0.1:9222";

const STORE_DIRS = [
  "/cursor/stores/user",
  "/cursor/stores/user/media",
  "/cursor/stores/self/media",
  "/cursor/stores/self/artifacts",
];

const posts = [
  {
    slug: "guest-list-dont-invite",
    exportPrefix: "ttk-guest-list",
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
    exportPrefix: "ttk-seating",
    layout: "hook",
    eyebrow: "Table planner",
    headline: "The seating chart is not the first job",
    bullets: [
      "Lock the guest list and RSVPs first. Then sit people. Tie The Knot keeps both in one\u00a0list.",
    ],
  },
  {
    slug: "save-the-date-after-list",
    exportPrefix: "ttk-save-the-date",
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

function copyRendered(file, destName) {
  for (const dir of STORE_DIRS) {
    mkdirSync(dir, { recursive: true });
    copyFileSync(file, path.join(dir, destName));
  }
}

const allCredits = [];

for (const post of posts) {
  const keys = TTK_SLIDE_PHOTOS[post.slug];
  if (!keys) throw new Error(`No Unsplash mapping for ${post.slug}`);
  const photos = [];
  for (const key of keys) {
    const file = await ensurePhoto(key);
    const meta = UNSPLASH_PHOTOS[key];
    photos.push({
      src: photoDataUri(file),
      alt: meta.alt,
      widget: post.layout === "hook" ? "tables" : undefined,
      position: meta.position,
    });
    allCredits.push({
      post: post.slug,
      slide: photos.length,
      ...creditFor(key),
      file: path.relative(root, file),
    });
  }
  post.photos = photos;
}

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
    const rendered = [];
    for (const slide of slides) {
      const dest = path.join(dir, slide.name);
      await page.setContent(slide.html, { waitUntil: "networkidle" });
      await waitForSlideReady(page);
      await page.screenshot({
        path: dest,
        type: "png",
        clip: { x: 0, y: 0, width: 1080, height: 1920 },
      });
      rendered.push(dest);
      copyRendered(dest, `${post.exportPrefix}-${slide.name}`);
    }
    const postCredits = allCredits.filter((row) => row.post === post.slug);
    writeFileSync(
      path.join(dir, "copy.json"),
      JSON.stringify(
        { headline: post.headline, bullets: post.bullets, layout: post.layout, eyebrow: post.eyebrow },
        null,
        2,
      ),
    );
    writeFileSync(path.join(dir, "credits.json"), JSON.stringify(postCredits, null, 2));
    console.log(`rendered ${dir} (${slides.length} slides)`);
  }
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(path.join(outRoot, "credits.json"), JSON.stringify(allCredits, null, 2));
} finally {
  await page.close();
  if (ownedBrowser) {
    await browser.close();
  }
}
