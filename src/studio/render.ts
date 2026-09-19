import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { chromeIsUp, connectChrome } from "../chrome/session.ts";
import { DRAFT_DIR } from "../paths.ts";
import { buildSlideHtml, slidesFor as slidesForHtml, waitForSlideReady } from "./slide-html.mjs";

export type DraftLayout = "hook" | "numbered_list";

export type RenderInput = {
  headline: string;
  bullets?: string[];
  layout: DraftLayout;
  eyebrow?: string;
};

export type RenderResult = {
  layout: DraftLayout;
  dir: string;
  files: string[];
};

export { buildSlideHtml };

export function slidesFor(input: RenderInput): Array<{ name: string; html: string }> {
  return slidesForHtml(input);
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
      await page.setContent(slide.html, { waitUntil: "networkidle" });
      await waitForSlideReady(page);
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
