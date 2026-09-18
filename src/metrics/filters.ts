import type {
  AccountMetrics,
  ConstraintResult,
  FilterResult,
  Filters,
  Verdict,
} from "../types.ts";
import { matchNiche, type NicheInput } from "./niche.ts";

export type EvaluateExtras = Pick<NicheInput, "signature" | "captions" | "keywords">;

export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function postsPerWeek(createTimes: number[]): number {
  if (createTimes.length === 0) {
    return 0;
  }
  if (createTimes.length === 1) {
    return 1;
  }
  const sorted = [...createTimes].sort((a, b) => a - b);
  const spanSeconds = sorted[sorted.length - 1]! - sorted[0]!;
  const weeks = Math.max(spanSeconds / (7 * 24 * 60 * 60), 1 / 7);
  return createTimes.length / weeks;
}

export function evaluateAccount(
  metrics: AccountMetrics,
  filters: Filters,
  extras: EvaluateExtras = {},
): FilterResult {
  const niche = matchNiche({
    username: metrics.username,
    nickname: metrics.nickname,
    signature: extras.signature,
    hashtags: metrics.hashtags,
    captions: extras.captions,
    keywords: extras.keywords ?? "wedding planning",
  });
  const breakdown: ConstraintResult[] = [
    grade("minSlideshowShare", metrics.slideshowShare, filters.minSlideshowShare, filters.nearMissMargin),
    grade("minMedianViews", metrics.medianViews, filters.minMedianViews, filters.nearMissMargin),
    grade(
      "minViewsPerFollower",
      metrics.viewsPerFollower,
      filters.minViewsPerFollower,
      filters.nearMissMargin,
    ),
    grade("minPostsPerWeek", metrics.postsPerWeek, filters.minPostsPerWeek, filters.nearMissMargin),
    {
      key: "niche",
      actual: niche.score,
      required: 1,
      status: niche.relevant ? "pass" : "fail",
      shortfall: niche.relevant ? 0 : 1,
    },
  ];

  const hasFail = breakdown.some((item) => item.status === "fail");
  const hasNear = breakdown.some((item) => item.status === "near");
  let verdict: Verdict = "passed";
  if (hasFail) {
    verdict = "failed";
  } else if (hasNear) {
    verdict = "near_miss";
  }

  const misses = breakdown.filter((item) => item.status !== "pass");
  const margin = misses.length === 0 ? 0 : Math.max(...misses.map((item) => item.shortfall));
  return { verdict, margin, breakdown };
}

function grade(
  key: ConstraintResult["key"],
  actual: number,
  required: number,
  nearMissMargin: number,
): ConstraintResult {
  if (required <= 0 || actual >= required) {
    return { key, actual, required, status: "pass", shortfall: 0 };
  }
  const shortfall = (required - actual) / required;
  const status = shortfall <= nearMissMargin ? "near" : "fail";
  return { key, actual, required, status, shortfall };
}
