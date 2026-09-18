import type { Filters } from "./types.ts";
import { DEFAULT_FILTERS } from "./types.ts";

export function parseFilters(input: Record<string, unknown> | undefined): Filters {
  if (!input) {
    return { ...DEFAULT_FILTERS };
  }
  return {
    minSlideshowShare: num(input.minSlideshowShare, DEFAULT_FILTERS.minSlideshowShare),
    minMedianViews: num(input.minMedianViews, DEFAULT_FILTERS.minMedianViews),
    minViewsPerFollower: num(input.minViewsPerFollower, DEFAULT_FILTERS.minViewsPerFollower),
    minPostsPerWeek: num(input.minPostsPerWeek, DEFAULT_FILTERS.minPostsPerWeek),
    nearMissMargin: num(input.nearMissMargin, DEFAULT_FILTERS.nearMissMargin),
  };
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
