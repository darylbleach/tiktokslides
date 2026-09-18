import { matchNiche } from "../metrics/niche.ts";
import type { TikTokAccount, TikTokPost } from "../types.ts";

export type SkipReason = "seen" | "video_only" | "no_posts" | "off_niche";

export type AuthorEvidence = {
  username: string;
  account: TikTokAccount;
  slideshowPosts: number;
  videoPosts: number;
  nicheScore: number;
};

export type CandidateSelection = {
  preferred: TikTokAccount[];
  fallback: TikTokAccount[];
  skipped: Array<{ username: string; reason: SkipReason }>;
};

export function selectDiscoveryCandidates(
  accounts: TikTokAccount[],
  posts: TikTokPost[],
  seen: Set<string>,
  photoAuthors: Iterable<string> = [],
  options: { keywords?: string } = {},
): CandidateSelection {
  const photoSet = new Set([...photoAuthors].map((name) => name.toLowerCase()));
  const byUser = new Map<string, AuthorEvidence>();

  for (const account of accounts) {
    const username = account.username.replace(/^@/, "").toLowerCase();
    if (username.length < 2) {
      continue;
    }
    const existing = byUser.get(username);
    if (!existing || account.followers > existing.account.followers) {
      byUser.set(username, {
        username,
        account: { ...account, username },
        slideshowPosts: existing?.slideshowPosts ?? 0,
        videoPosts: existing?.videoPosts ?? 0,
        nicheScore: existing?.nicheScore ?? 0,
      });
    }
  }

  for (const name of photoSet) {
    if (name.length < 2) {
      continue;
    }
    if (!byUser.has(name)) {
      byUser.set(name, {
        username: name,
        account: { username: name, nickname: "", followers: 0, signature: "" },
        slideshowPosts: 0,
        videoPosts: 0,
        nicheScore: 0,
      });
    }
  }

  for (const post of posts) {
    const username = post.username.replace(/^@/, "").toLowerCase();
    if (username.length < 2) {
      continue;
    }
    const current = byUser.get(username) ?? {
      username,
      account: { username, nickname: "", followers: 0, signature: "" },
      slideshowPosts: 0,
      videoPosts: 0,
      nicheScore: 0,
    };
    if (post.isSlideshow) {
      current.slideshowPosts += 1;
    } else {
      current.videoPosts += 1;
    }
    byUser.set(username, current);
  }

  for (const name of photoSet) {
    const current = byUser.get(name);
    if (current && current.slideshowPosts === 0) {
      current.slideshowPosts = 1;
    }
  }

  const preferred: AuthorEvidence[] = [];
  const fallback: AuthorEvidence[] = [];
  const skipped: CandidateSelection["skipped"] = [];

  for (const evidence of byUser.values()) {
    if (seen.has(evidence.username)) {
      skipped.push({ username: evidence.username, reason: "seen" });
      continue;
    }
    if (evidence.slideshowPosts === 0 && evidence.videoPosts === 0) {
      skipped.push({ username: evidence.username, reason: "no_posts" });
      continue;
    }
    if (evidence.slideshowPosts === 0 && evidence.videoPosts >= 2) {
      skipped.push({ username: evidence.username, reason: "video_only" });
      continue;
    }
    const authorPosts = posts.filter((post) => post.username.replace(/^@/, "").toLowerCase() === evidence.username);
    const niche = matchNiche({
      username: evidence.username,
      nickname: evidence.account.nickname,
      signature: evidence.account.signature,
      hashtags: authorPosts.flatMap((post) => post.hashtags),
      captions: authorPosts.map((post) => post.caption),
      keywords: options.keywords,
    });
    evidence.nicheScore = niche.score;
    if (options.keywords != null && !niche.relevant) {
      skipped.push({ username: evidence.username, reason: "off_niche" });
      continue;
    }
    if (evidence.slideshowPosts > 0) {
      preferred.push(evidence);
    } else {
      fallback.push(evidence);
    }
  }

  preferred.sort(
    (a, b) => b.nicheScore - a.nicheScore || b.slideshowPosts - a.slideshowPosts || b.account.followers - a.account.followers,
  );
  fallback.sort((a, b) => b.nicheScore - a.nicheScore || b.account.followers - a.account.followers);

  return {
    preferred: preferred.map((item) => item.account),
    fallback: fallback.map((item) => item.account),
    skipped,
  };
}
