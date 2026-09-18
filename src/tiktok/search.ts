import type { Page } from "playwright";
import {
  attachJsonSniffer,
  assertReadable,
  gentleScroll,
  gotoHuman,
  humanDelay,
} from "../chrome/session.ts";
import type { TikTokAccount, TikTokPost } from "../types.ts";
import { selectDiscoveryCandidates } from "./candidates.ts";
import { collectFromUnknown, mergeCollected, parseRehydration, parseSigiState } from "./parse.ts";

export type SearchResult = {
  keyword: string;
  accounts: TikTokAccount[];
  posts: TikTokPost[];
};

export type KeywordSearch = {
  readonly exhausted: boolean;
  collectMore(): Promise<SearchResult>;
  close(): void;
};

const MAX_SCROLLS = 24;
const STALE_ROUNDS = 3;
const SCROLLS_PER_ROUND = 3;

export function openKeywordSearch(page: Page, keyword: string): KeywordSearch {
  const payloads: unknown[] = [];
  let detach: (() => void) | null = null;
  let opened = false;
  let scrollCount = 0;
  let staleRounds = 0;
  let lastFingerprint = "";
  let done = false;

  return {
    get exhausted() {
      return done;
    },
    async collectMore(): Promise<SearchResult> {
      if (!detach) {
        detach = attachJsonSniffer(page, payloads);
      }
      if (!opened) {
        await openSlideshowSearch(page, keyword);
        opened = true;
      }
      await gentleScroll(page, SCROLLS_PER_ROUND);
      scrollCount += SCROLLS_PER_ROUND;
      await humanDelay(400, 900);

      const harvested = await harvestSearch(page, payloads);
      const fingerprint = fingerprintCollected(harvested);
      if (fingerprint === lastFingerprint) {
        staleRounds += 1;
      } else {
        staleRounds = 0;
        lastFingerprint = fingerprint;
      }
      done = staleRounds >= STALE_ROUNDS || scrollCount >= MAX_SCROLLS;
      return { keyword, accounts: harvested.accounts, posts: harvested.posts };
    },
    close() {
      detach?.();
      detach = null;
    },
  };
}

export async function searchKeyword(page: Page, keyword: string, targetAccounts: number): Promise<SearchResult> {
  const search = openKeywordSearch(page, keyword);
  const seen = new Set<string>();
  let last: SearchResult = { keyword, accounts: [], posts: [] };
  try {
    while (!search.exhausted) {
      last = await search.collectMore();
      const selected = selectDiscoveryCandidates(last.accounts, last.posts, seen, photoAuthorsFrom(last.posts), {
        keywords: keyword,
      });
      const accounts = [...selected.preferred, ...selected.fallback];
      if (accounts.length >= targetAccounts) {
        return { keyword, accounts, posts: last.posts };
      }
    }
    const selected = selectDiscoveryCandidates(last.accounts, last.posts, seen, photoAuthorsFrom(last.posts), {
      keywords: keyword,
    });
    return { keyword, accounts: [...selected.preferred, ...selected.fallback], posts: last.posts };
  } finally {
    search.close();
  }
}

async function openSlideshowSearch(page: Page, keyword: string): Promise<void> {
  const query = encodeURIComponent(keyword);
  await gotoHuman(page, `https://www.tiktok.com/search/photo?q=${query}`);
  await humanDelay(800, 1600);
  await assertReadable(page);
  const onPhoto = /search\/photo/i.test(page.url());
  if (!onPhoto) {
    await gotoHuman(page, `https://www.tiktok.com/search?q=${query}`);
    await humanDelay(600, 1200);
    await clickSearchTab(page, ["photos", "photo"]);
    await humanDelay(800, 1400);
    await assertReadable(page);
  }
}

async function clickSearchTab(page: Page, labels: string[]): Promise<boolean> {
  const wanted = labels.map((label) => label.toLowerCase());
  return page.evaluate((needles) => {
    const nodes = [...document.querySelectorAll("a, button, [role='tab']")];
    const match = nodes.find((node) => needles.includes((node.textContent ?? "").trim().toLowerCase()));
    if (!match || !(match instanceof HTMLElement)) {
      return false;
    }
    match.click();
    return true;
  }, wanted);
}

async function harvestSearch(
  page: Page,
  payloads: unknown[],
): Promise<{ posts: TikTokPost[]; accounts: TikTokAccount[] }> {
  const html = await page.content();
  const fromNetwork = payloads.map((payload) => collectFromUnknown(payload));
  const fromHtml = [collectFromUnknown(parseRehydration(html)), collectFromUnknown(parseSigiState(html))];
  const photoAuthors = await collectPhotoAuthorsFromDom(page);
  const fromDom = {
    posts: [] as TikTokPost[],
    accounts: photoAuthors.map((username) => ({
      username,
      nickname: "",
      followers: 0,
      signature: "",
    })),
  };
  const merged = mergeCollected(...fromNetwork, ...fromHtml, fromDom);
  return merged;
}

async function collectPhotoAuthorsFromDom(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found = new Set<string>();
    for (const anchor of document.querySelectorAll("a[href*='/@']")) {
      const href = anchor.getAttribute("href") ?? "";
      const match = href.match(/\/@([A-Za-z0-9._]+)\/photo\//);
      if (match?.[1]) {
        found.add(match[1]);
      }
    }
    return [...found];
  });
}

function photoAuthorsFrom(posts: TikTokPost[]): string[] {
  return posts.filter((post) => post.isSlideshow).map((post) => post.username);
}

function fingerprintCollected(collected: { posts: TikTokPost[]; accounts: TikTokAccount[] }): string {
  const posts = collected.posts.map((post) => post.id).sort().join(",");
  const accounts = collected.accounts.map((account) => account.username.toLowerCase()).sort().join(",");
  return `${posts}|${accounts}`;
}
