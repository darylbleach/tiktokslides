import { DEFAULT_FILTERS } from "../types.ts";
import type { ConstraintResult, Filters, StoredAccount, Verdict } from "../types.ts";
import { evaluateAccount, type EvaluateExtras } from "./filters.ts";

const CONSTRAINT_LABEL: Record<ConstraintResult["key"], string> = {
  minSlideshowShare: "share",
  minMedianViews: "median",
  minViewsPerFollower: "vpf",
  minPostsPerWeek: "cadence",
  niche: "niche",
};

export type LibraryRow = StoredAccount & {
  breakdown: ConstraintResult[];
  missed: string[];
};

export function decorateLibraryAccount(
  account: StoredAccount,
  filters: Filters = DEFAULT_FILTERS,
  extras: EvaluateExtras = {},
): LibraryRow {
  const judged = evaluateAccount(account, filters, {
    signature: extras.signature ?? account.signature,
    captions: extras.captions,
    keywords: extras.keywords,
  });
  return {
    ...account,
    verdict: judged.verdict,
    margin: judged.margin,
    breakdown: judged.breakdown,
    missed: judged.breakdown.filter((item) => item.status !== "pass").map(formatMiss),
  };
}

export function formatLibraryTable(rows: LibraryRow[]): string {
  if (rows.length === 0) {
    return "library empty";
  }
  const lines = rows.map((row) => {
    const misses = row.missed.length ? `  missed: ${row.missed.join(", ")}` : "";
    return [
      `@${row.username}`,
      pad(row.verdict, 9),
      `share=${row.slideshowShare.toFixed(2)}`,
      `median=${Math.round(row.medianViews)}`,
      `vpf=${row.viewsPerFollower.toFixed(2)}`,
      `cadence=${row.postsPerWeek.toFixed(2)}`,
    ].join("  ") + misses;
  });
  const counts = countVerdicts(rows);
  lines.push("");
  lines.push(`${counts.passed} passed, ${counts.nearMiss} near-miss, ${counts.failed} failed`);
  return lines.join("\n");
}

export function countVerdicts(rows: Array<{ verdict: Verdict }>): {
  passed: number;
  nearMiss: number;
  failed: number;
} {
  return {
    passed: rows.filter((row) => row.verdict === "passed").length,
    nearMiss: rows.filter((row) => row.verdict === "near_miss").length,
    failed: rows.filter((row) => row.verdict === "failed").length,
  };
}

function formatMiss(item: ConstraintResult): string {
  if (item.key === "niche") {
    return "niche";
  }
  return `${CONSTRAINT_LABEL[item.key]} ${formatActual(item)}<${formatRequired(item)}`;
}

function formatActual(item: ConstraintResult): string {
  if (item.key === "minSlideshowShare" || item.key === "minViewsPerFollower") {
    return item.actual.toFixed(2);
  }
  if (item.key === "minMedianViews") {
    return String(Math.round(item.actual));
  }
  return item.actual.toFixed(2);
}

function formatRequired(item: ConstraintResult): string {
  if (item.key === "minSlideshowShare" || item.key === "minViewsPerFollower") {
    return item.required.toFixed(2);
  }
  if (item.key === "minMedianViews") {
    return String(Math.round(item.required));
  }
  return String(item.required);
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : `${value}${" ".repeat(width - value.length)}`;
}
