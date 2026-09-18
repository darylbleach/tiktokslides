import type { Page } from "playwright";
import {
  attachJsonSniffer,
  assertReadable,
  gentleScroll,
  gotoHuman,
  humanDelay,
} from "../chrome/session.ts";
import type { TikTokAccount, TikTokPost } from "../types.ts";
import { collectFromUnknown, mergeCollected, parseRehydration, parseSigiState } from "./parse.ts";

export type SearchResult = {
  keyword: string;
  accounts: TikTokAccount[];
  posts: TikTokPost[];
};

export async function searchKeyword(page: Page, keyword: string, targetAccounts: number): Promise<SearchResult> {
  const payloads: unknown[] = [];
  const detach = attachJsonSniffer(page, payloads);
  try {
    const query = encodeURIComponent(keyword);
    await gotoHuman(page, `https://www.tiktok.com/search?q=${query}`);
    await humanDelay(1200, 2200);
    await assertReadable(page);
    const scrolls = Math.min(6, Math.max(2, Math.ceil(targetAccounts / 8)));
    await gentleScroll(page, scrolls);

    const html = await page.content();
    const fromNetwork = payloads.map((payload) => collectFromUnknown(payload));
    const fromHtml = [
      collectFromUnknown(parseRehydration(html)),
      collectFromUnknown(parseSigiState(html)),
    ];
    const fromDom = await collectUsernamesFromDom(page);
    const merged = mergeCollected(...fromNetwork, ...fromHtml, fromDom);
    return {
      keyword,
      accounts: merged.accounts.slice(0, Math.max(targetAccounts * 3, 20)),
      posts: merged.posts,
    };
  } finally {
    detach();
  }
}

async function collectUsernamesFromDom(page: Page): Promise<{
  posts: TikTokPost[];
  accounts: TikTokAccount[];
}> {
  const usernames = await page.evaluate(() => {
    const found = new Set<string>();
    for (const anchor of document.querySelectorAll("a[href*='/@']")) {
      const href = anchor.getAttribute("href") ?? "";
      const match = href.match(/\/@([A-Za-z0-9._]+)/);
      if (match?.[1] && match[1] !== "search") {
        found.add(match[1]);
      }
    }
    return [...found];
  });
  return {
    posts: [],
    accounts: usernames.map((username) => ({
      username,
      nickname: "",
      followers: 0,
      signature: "",
    })),
  };
}
