import type { TikTokAccount, TikTokPost } from "../types.ts";

const SLIDESHOW_TYPES = new Set([68, 150, 412]);

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function isSlideshowItem(item: Record<string, unknown>): boolean {
  if (asRecord(item.imagePost) || asRecord(item.image_post_info) || asRecord(item.imagePostInfo)) {
    return true;
  }
  if (asArray(item.images).length > 0) {
    return true;
  }
  const awemeType = num(item.awemeType || item.aweme_type);
  if (SLIDESHOW_TYPES.has(awemeType)) {
    return true;
  }
  return str(item.contentType).toLowerCase() === "image";
}

export function collectFromUnknown(payload: unknown): {
  posts: TikTokPost[];
  accounts: TikTokAccount[];
} {
  const posts = new Map<string, TikTokPost>();
  const accounts = new Map<string, TikTokAccount>();
  walk(payload, posts, accounts, 0);
  return { posts: [...posts.values()], accounts: [...accounts.values()] };
}

export function parseRehydration(html: string): unknown | null {
  const match = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/,
  );
  return decodeScriptJson(match?.[1]);
}

export function parseSigiState(html: string): unknown | null {
  const match = html.match(/<script id="SIGI_STATE"[^>]*>([^<]+)<\/script>/);
  return decodeScriptJson(match?.[1]);
}

export function mergeCollected(
  ...batches: Array<{ posts: TikTokPost[]; accounts: TikTokAccount[] }>
): { posts: TikTokPost[]; accounts: TikTokAccount[] } {
  const posts = new Map<string, TikTokPost>();
  const accounts = new Map<string, TikTokAccount>();
  for (const batch of batches) {
    for (const post of batch.posts) {
      const existing = posts.get(post.id);
      if (!existing || post.imageUrls.length > existing.imageUrls.length || post.views > existing.views) {
        posts.set(post.id, existing ? { ...existing, ...post, imageUrls: post.imageUrls.length ? post.imageUrls : existing.imageUrls } : post);
      }
    }
    for (const account of batch.accounts) {
      const existing = accounts.get(account.username);
      if (!existing || account.followers > existing.followers) {
        accounts.set(account.username, account);
      }
    }
  }
  return { posts: [...posts.values()], accounts: [...accounts.values()] };
}

function decodeScriptJson(raw: string | undefined): unknown | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  } catch {
    return null;
  }
}

function walk(
  value: unknown,
  posts: Map<string, TikTokPost>,
  accounts: Map<string, TikTokAccount>,
  depth: number,
): void {
  if (depth > 12 || value == null) {
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      walk(entry, posts, accounts, depth + 1);
    }
    return;
  }
  const record = asRecord(value);
  if (!record) {
    return;
  }

  const post = maybePost(record);
  if (post) {
    posts.set(post.id, post);
  }
  const account = maybeAccount(record);
  if (account) {
    const existing = accounts.get(account.username);
    if (!existing || account.followers > existing.followers) {
      accounts.set(account.username, account);
    }
  }

  for (const nested of Object.values(record)) {
    if (typeof nested === "object" && nested !== null) {
      walk(nested, posts, accounts, depth + 1);
    }
  }
}

function maybePost(item: Record<string, unknown>): TikTokPost | null {
  const id = str(item.id || item.aweme_id || item.awemeId);
  const author = asRecord(item.author) ?? asRecord(item.authorInfo);
  const username = str(author?.uniqueId || author?.unique_id || item.authorUniqueId);
  if (!id || !username) {
    return null;
  }
  const stats = asRecord(item.stats) ?? asRecord(item.statistics) ?? {};
  const statsV2 = asRecord(item.statsV2) ?? {};
  const views = num(stats.playCount || stats.play_count || statsV2.playCount);
  const likes = num(stats.diggCount || stats.digg_count || statsV2.diggCount);
  const imageUrls = imageUrlsFrom(item);
  const hashtags = hashtagsFrom(item);
  const createTime = num(item.createTime || item.create_time);
  const cleanUser = username.replace(/^@/, "");
  return {
    id,
    username: cleanUser,
    url: `https://www.tiktok.com/@${cleanUser}/photo/${id}`,
    caption: str(item.desc || item.description || item.title),
    views,
    likes,
    isSlideshow: isSlideshowItem(item) || imageUrls.length > 0,
    slideCount: imageUrls.length,
    createTime,
    hashtags,
    coverUrl: coverUrlFrom(item),
    imageUrls,
  };
}

function maybeAccount(record: Record<string, unknown>): TikTokAccount | null {
  const user = asRecord(record.user) ?? record;
  const username = str(user.uniqueId || user.unique_id);
  if (!username) {
    return null;
  }
  const stats = asRecord(record.stats) ?? asRecord(user.stats) ?? asRecord(user.authorStats) ?? {};
  const followers = num(
    stats.followerCount || stats.follower_count || user.followerCount || user.follower_count,
  );
  return {
    username: username.replace(/^@/, ""),
    nickname: str(user.nickname),
    followers,
    signature: str(user.signature),
  };
}

function imageUrlsFrom(item: Record<string, unknown>): string[] {
  const imagePost =
    asRecord(item.imagePost) ?? asRecord(item.image_post_info) ?? asRecord(item.imagePostInfo);
  const images = asArray(imagePost?.images ?? item.images);
  const urls: string[] = [];
  for (const image of images) {
    const rec = asRecord(image);
    if (!rec) {
      continue;
    }
    const imageURL = asRecord(rec.imageURL) ?? asRecord(rec.image_url);
    const display = asRecord(rec.displayImage) ?? asRecord(rec.display_image);
    const list = asArray(imageURL?.urlList ?? imageURL?.url_list ?? display?.urlList);
    const first = str(list[0]);
    if (first) {
      urls.push(first);
    }
  }
  return urls;
}

function coverUrlFrom(item: Record<string, unknown>): string | null {
  const video = asRecord(item.video) ?? {};
  const cover = asRecord(video.cover) ?? asRecord(video.originCover) ?? asRecord(item.cover);
  const list = asArray(cover?.urlList ?? cover?.url_list);
  return str(list[0]) || null;
}

function hashtagsFrom(item: Record<string, unknown>): string[] {
  const challenges = asArray(item.challenges ?? item.textExtra);
  const tags: string[] = [];
  for (const challenge of challenges) {
    const rec = asRecord(challenge);
    const title = str(rec?.title || rec?.hashtagName || rec?.hashtag_name);
    if (title) {
      tags.push(title.replace(/^#/, ""));
    }
  }
  const fromCaption = str(item.desc).match(/#([\p{L}\p{N}_]+)/gu) ?? [];
  for (const tag of fromCaption) {
    tags.push(tag.slice(1));
  }
  return [...new Set(tags)];
}
