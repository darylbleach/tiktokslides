import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "playwright";
import { attachJsonSniffer, assertReadable, gotoHuman, humanDelay } from "../chrome/session.ts";
import { DOWNLOAD_DIR } from "../paths.ts";
import { collectFromUnknown, mergeCollected, parseRehydration, parseSigiState } from "./parse.ts";

export type DownloadResult = {
  postId: string;
  url: string;
  dir: string;
  files: string[];
};

export function postIdFromUrl(url: string): string {
  const match = url.match(/\/(photo|video)\/(\d+)/);
  return match?.[2] ?? url.replace(/[^\w.-]+/g, "_").slice(0, 80);
}

export async function downloadSlideshow(page: Page, url: string): Promise<DownloadResult> {
  const payloads: unknown[] = [];
  const detach = attachJsonSniffer(page, payloads);
  try {
    await gotoHuman(page, url);
    await humanDelay(900, 1800);
    await assertReadable(page);
    const html = await page.content();
    const merged = mergeCollected(
      ...payloads.map((payload) => collectFromUnknown(payload)),
      collectFromUnknown(parseRehydration(html)),
      collectFromUnknown(parseSigiState(html)),
    );
    const postId = postIdFromUrl(url);
    const post = merged.posts.find((item) => item.id === postId) ?? merged.posts[0];
    const imageUrls = post?.imageUrls ?? (await imageUrlsFromDom(page));
    if (imageUrls.length === 0) {
      throw new Error("No slide images found on that post. It may be a video, not a slideshow.");
    }
    const dir = path.join(DOWNLOAD_DIR, postId);
    mkdirSync(dir, { recursive: true });
    const files: string[] = [];
    for (const [index, imageUrl] of imageUrls.entries()) {
      const file = path.join(dir, `${String(index + 1).padStart(2, "0")}.jpg`);
      const buffer = await fetchImage(page, imageUrl);
      writeFileSync(file, buffer);
      files.push(file);
      await humanDelay(250, 600);
    }
    return { postId, url, dir, files };
  } finally {
    detach();
  }
}

async function fetchImage(page: Page, imageUrl: string): Promise<Buffer> {
  const response = await page.request.get(imageUrl, {
    headers: { Referer: "https://www.tiktok.com/" },
  });
  if (!response.ok()) {
    throw new Error(`Failed to download slide image (${response.status()}).`);
  }
  return Buffer.from(await response.body());
}

async function imageUrlsFromDom(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const urls: string[] = [];
    for (const image of document.querySelectorAll("img")) {
      const src = image.currentSrc || image.src;
      if (src && /tiktokcdn|muscdn|image/i.test(src)) {
        urls.push(src);
      }
    }
    return [...new Set(urls)];
  });
}
