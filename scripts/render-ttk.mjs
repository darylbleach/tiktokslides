import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = path.join(root, "data", "drafts");
const cdp = process.env.SLIDE_RESEARCH_CDP_URL ?? "http://127.0.0.1:9222";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slideHtml(headline, body, kicker = "Tie The Knot") {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; padding: 0; width: 1080px; height: 1920px; }
    body {
      background: #1b1410;
      color: #f6efe6;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .slide {
      width: 860px;
      min-height: 1400px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 48px;
    }
    .kicker {
      font-size: 36px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #e2b57a;
    }
    h1 {
      margin: 0;
      font-size: 84px;
      line-height: 1.05;
      font-weight: 700;
    }
    p {
      margin: 0;
      font-size: 52px;
      line-height: 1.25;
      color: #f6efe6;
    }
  </style>
</head>
<body>
  <div class="slide">
    ${kicker ? `<div class="kicker">${escapeHtml(kicker)}</div>` : ""}
    <h1>${escapeHtml(headline)}</h1>
    ${body ? `<p>${escapeHtml(body)}</p>` : ""}
  </div>
</body>
</html>`;
}

const posts = [
  {
    slug: "guest-list-dont-invite",
    layout: "numbered_list",
    headline: "You do not have to invite them",
    bullets: [
      "Your mum's colleague from 2009",
      "A plus one for someone who is single and fine",
      "The cousin you have not seen since you were twelve",
      "Work people you would not grab a pint with",
      "Keep the list in Tie The Knot so the guilt edits stay in one place",
    ],
  },
  {
    slug: "seating-chart-after-rsvp",
    layout: "hook",
    headline: "The seating chart is not the first job",
    bullets: [
      "Lock the guest list and RSVPs first. Then sit people. Tie The Knot keeps both in one list.",
    ],
  },
  {
    slug: "save-the-date-after-list",
    layout: "numbered_list",
    headline: "Do not send save the dates yet",
    bullets: [
      "If the names are still moving, the dates will too",
      "Write the must-invite list before the pretty stationery",
      "Plus ones belong in the list, not in a last-minute panic",
      "When the list is locked, send it. Tie The Knot is that list.",
    ],
  },
];

const browser = await chromium.connectOverCDP(cdp);
const context = browser.contexts()[0] ?? (await browser.newContext({ viewport: { width: 1080, height: 1920 } }));
const page = await context.newPage();
await page.setViewportSize({ width: 1080, height: 1920 });

try {
  for (const post of posts) {
    const dir = path.join(outRoot, post.slug);
    mkdirSync(dir, { recursive: true });
    const slides =
      post.layout === "hook"
        ? [{ name: "01.png", html: slideHtml(post.headline, post.bullets[0] ?? "") }]
        : [
            { name: "01.png", html: slideHtml(post.headline, `${post.bullets.length} things`, "List") },
            ...post.bullets.map((bullet, index) => ({
              name: `${String(index + 2).padStart(2, "0")}.png`,
              html: slideHtml(`${index + 1}.`, bullet, ""),
            })),
          ];
    for (const slide of slides) {
      await page.setContent(slide.html, { waitUntil: "domcontentloaded" });
      await page.screenshot({
        path: path.join(dir, slide.name),
        type: "png",
        clip: { x: 0, y: 0, width: 1080, height: 1920 },
      });
    }
    writeFileSync(
      path.join(dir, "copy.json"),
      JSON.stringify({ headline: post.headline, bullets: post.bullets, layout: post.layout }, null, 2),
    );
    console.log(`rendered ${dir} (${slides.length} slides)`);
  }
} finally {
  await page.close();
}
