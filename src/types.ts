export type Verdict = "passed" | "near_miss" | "failed";

export type Filters = {
  minSlideshowShare: number;
  minMedianViews: number;
  minViewsPerFollower: number;
  minPostsPerWeek: number;
  nearMissMargin: number;
};

export const DEFAULT_FILTERS: Filters = {
  minSlideshowShare: 0.5,
  minMedianViews: 1_000,
  minViewsPerFollower: 0.2,
  minPostsPerWeek: 0.3,
  nearMissMargin: 0.1,
};

export type ConstraintResult = {
  key: keyof Omit<Filters, "nearMissMargin">;
  actual: number;
  required: number;
  status: "pass" | "near" | "fail";
  shortfall: number;
};

export type FilterResult = {
  verdict: Verdict;
  margin: number;
  breakdown: ConstraintResult[];
};

export type TikTokPost = {
  id: string;
  username: string;
  url: string;
  caption: string;
  views: number;
  likes: number;
  isSlideshow: boolean;
  slideCount: number;
  createTime: number;
  hashtags: string[];
  coverUrl: string | null;
  imageUrls: string[];
};

export type TikTokAccount = {
  username: string;
  nickname: string;
  followers: number;
  signature: string;
};

export type AccountMetrics = {
  username: string;
  nickname: string;
  followers: number;
  postCount: number;
  slideshowCount: number;
  slideshowShare: number;
  medianViews: number;
  viewsPerFollower: number;
  postsPerWeek: number;
  hashtags: string[];
};

export type StoredAccount = AccountMetrics & {
  verdict: Verdict;
  margin: number;
  measuredAt: string;
  searchId: number | null;
  signature: string;
};

export type NamedFormat = {
  id: number;
  name: string;
  notes: string;
  examplePostIds: string[];
  createdAt: string;
};

export type JobStatus = "queued" | "running" | "needs_human" | "done" | "error";

export type JobProgress = {
  measured: number;
  target: number;
  passed: number;
  nearMiss: number;
  failed: number;
  currentUsername: string | null;
};

export type Job = {
  id: string;
  type: "discovery" | "download" | "render";
  status: JobStatus;
  keywords: string | null;
  progress: JobProgress;
  needsHumanReason: string | null;
  error: string | null;
  result: unknown;
  createdAt: string;
  updatedAt: string;
};

export class CaptchaError extends Error {
  constructor(message = "TikTok showed a verification check. Clear it in the Chrome window.") {
    super(message);
    this.name = "CaptchaError";
  }
}

export class ChromeNotRunningError extends Error {
  constructor() {
    super(
      "Chrome is not exposing DevTools. Run `pnpm chrome`, log into TikTok, and leave the window open.",
    );
    this.name = "ChromeNotRunningError";
  }
}

export class LoginRequiredError extends Error {
  constructor(message = "Log into TikTok in the debug Chrome window, then rerun.") {
    super(message);
    this.name = "LoginRequiredError";
  }
}
