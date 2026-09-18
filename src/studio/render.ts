import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { chromeIsUp, connectChrome } from "../chrome/session.ts";
import { DRAFT_DIR } from "../paths.ts";

export type DraftLayout = "hook" | "numbered_list";

export type RenderInput = {
  headline: string;
  bullets?: string[];
  layout: DraftLayout;
};

export type RenderResult = {
  layout: DraftLayout;
  dir: string;
  files: string[];
};

export function buildSlideHtml(headline: string, body: string, kicker = ""): string {
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
      font-size: 92px;
      line-height: 1.05;
      font-weight: 700;
    }
    p {
      margin: 0;
      font-size: 56px;
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

export function slidesFor(input: RenderInput): Array<{ name: string; html: string }> {
  const bullets = (input.bullets ?? []).map((item) => item.trim()).filter(Boolean);
  if (input.layout === "hook") {
    return [
      {
        name: "01.png",
        html: buildSlideHtml(input.headline, bullets[0] ?? "", "Tie The Knot"),
      },
    ];
  }
  if (input.layout === "numbered_list") {
    const slides = [
      {
        name: "01.png",
        html: buildSlideHtml(input.headline, bullets.length ? `${bullets.length} things` : "", "List"),
      },
    ];
    bullets.forEach((bullet, index) => {
      slides.push({
        name: `${String(index + 2).padStart(2, "0")}.png`,
        html: buildSlideHtml(`${index + 1}.`, bullet),
      });
    });
    return slides;
  }
  const _never: never = input.layout;
  return _never;
}

export async function renderDraft(input: RenderInput): Promise<RenderResult> {
  const slides = slidesFor(input);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(DRAFT_DIR, `${input.layout}-${stamp}`);
  mkdirSync(dir, { recursive: true });
  const files: string[] = [];

  const session = (await chromeIsUp()) ? await connectChrome() : null;
  const browser = session ? null : await chromium.launch({ headless: true });
  const context = session?.context ?? (await browser!.newContext({ viewport: { width: 1080, height: 1920 } }));
  const page = await context.newPage();
  await page.setViewportSize({ width: 1080, height: 1920 });
  try {
    for (const slide of slides) {
      const file = path.join(dir, slide.name);
      await page.setContent(slide.html, { waitUntil: "domcontentloaded" });
      await page.screenshot({ path: file, type: "png", clip: { x: 0, y: 0, width: 1080, height: 1920 } });
      files.push(file);
    }
  } finally {
    await page.close();
    if (browser) {
      await browser.close();
    }
  }
  return { layout: input.layout, dir, files };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
