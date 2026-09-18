import type { Page } from "playwright";
import { attachJsonSniffer, assertReadable, gentleScroll, gotoHuman, humanDelay } from "../chrome/session.ts";
import { median, postsPerWeek } from "../metrics/filters.ts";
import type { AccountMetrics, TikTokAccount, TikTokPost } from "../types.ts";
import { collectFromUnknown, mergeCollected, parseRehydration, parseSigiState } from "./parse.ts";

export type ProfileSnapshot = {
  account: TikTokAccount;
  posts: TikTokPost[];
  metrics: AccountMetrics;
};

export async function measureProfile(page: Page, username: string): Promise<ProfileSnapshot> {
  const clean = username.replace(/^@/, "");
  const payloads: unknown[] = [];
  const detach = attachJsonSniffer(page, payloads);
  try {
    await gotoHuman(page, `https://www.tiktok.com/@${clean}`);
    await humanDelay(1000, 2000);
    await assertReadable(page);
    await gentleScroll(page, 3);

    const html = await page.content();
    const merged = mergeCollected(
      ...payloads.map((payload) => collectFromUnknown(payload)),
      collectFromUnknown(parseRehydration(html)),
      collectFromUnknown(parseSigiState(html)),
    );
    const account =
      merged.accounts.find((item) => item.username.toLowerCase() === clean.toLowerCase()) ?? {
        username: clean,
        nickname: clean,
        followers: 0,
        signature: "",
      };
    const posts = merged.posts
      .filter((post) => post.username.toLowerCase() === clean.toLowerCase())
      .sort((a, b) => b.createTime - a.createTime)
      .slice(0, 30);
    return {
      account,
      posts,
      metrics: metricsFrom(account, posts),
    };
  } finally {
    detach();
  }
}

export function metricsFrom(account: TikTokAccount, posts: TikTokPost[]): AccountMetrics {
  const slideshows = posts.filter((post) => post.isSlideshow);
  const slideshowShare = posts.length === 0 ? 0 : slideshows.length / posts.length;
  const medianViews = median(slideshows.map((post) => post.views));
  const viewsPerFollower = account.followers > 0 ? medianViews / account.followers : 0;
  const hashtags = [...new Set(posts.flatMap((post) => post.hashtags))].slice(0, 24);
  return {
    username: account.username,
    nickname: account.nickname || account.username,
    followers: account.followers,
    postCount: posts.length,
    slideshowCount: slideshows.length,
    slideshowShare,
    medianViews,
    viewsPerFollower,
    postsPerWeek: postsPerWeek(posts.map((post) => post.createTime)),
    hashtags,
  };
}
