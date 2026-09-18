import {
  downloadSlideshowJob,
  listLibraryAccounts,
  persistFormat,
  readAccount,
  readFormats,
  readJob,
  renderDraftJob,
  startDiscoveryJob,
  waitForJob,
} from "./api.ts";
import { log } from "./log.ts";
import { formatLibraryTable } from "./metrics/library-view.ts";
import type { DraftLayout } from "./studio/render.ts";
import type { Verdict } from "./types.ts";

const [command, ...rest] = process.argv.slice(2);

try {
  await main(command, rest);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  log(message);
  process.exitCode = 1;
}

async function main(cmd: string | undefined, args: string[]): Promise<void> {
  switch (cmd) {
    case "discover":
      await discover(args);
      return;
    case "job":
      printJson(readJob(need(args[0], "job id")));
      return;
    case "library": {
      const rows = listLibraryAccounts({
        niche: flag(args, "niche"),
        verdict: flag(args, "verdict") as Verdict | undefined,
        minViews: numFlag(args, "min-views"),
      });
      if (args.includes("--json")) {
        printJson(rows);
        return;
      }
      log(formatLibraryTable(rows));
      return;
    }
    case "account":
      printJson(await readAccount(need(args[0], "username"), true));
      return;
    case "download":
      printJson(await downloadSlideshowJob(need(args[0], "url")));
      return;
    case "formats":
      if (flag(args, "name")) {
        printJson(
          persistFormat({
            name: flag(args, "name")!,
            notes: flag(args, "notes") ?? "",
            examplePostIds: csvFlag(args, "posts"),
            exampleUrls: csvFlag(args, "urls"),
          }),
        );
        return;
      }
      printJson(readFormats());
      return;
    case "render":
      printJson(
        await renderDraftJob({
          headline: need(flag(args, "headline") ?? args[0], "headline"),
          bullets: csvFlag(args, "bullets"),
          layout: (flag(args, "layout") ?? "hook") as DraftLayout,
        }),
      );
      return;
    default:
      log(`Usage:
  pnpm discover "wedding planning" --target 20
  pnpm job <id>
  pnpm library --niche wedding --verdict passed --min-views 1000
  pnpm account <username>
  pnpm download <url>
  pnpm formats --name "Numbered hook" --posts 123,456
  pnpm render --headline "..." --bullets "a,b,c" --layout numbered_list`);
  }
}

async function discover(args: string[]): Promise<void> {
  const keywords = positional(args) ?? "wedding planning";
  const target = numFlag(args, "target") ?? 20;
  const job = startDiscoveryJob(keywords, target, {
    minSlideshowShare: numFlag(args, "min-slideshow-share"),
    minMedianViews: numFlag(args, "min-median-views"),
    minViewsPerFollower: numFlag(args, "min-views-per-follower"),
    minPostsPerWeek: numFlag(args, "min-posts-per-week"),
    nearMissMargin: numFlag(args, "near-miss-margin"),
  });
  log(`Job ${job.id} started. Measuring ${target} accounts for "${keywords}".`);
  const done = await waitForJob(job.id);
  const progress = done.progress;
  const result = asRecord(done.result);
  const exhausted = result?.exhausted === true;
  const note = typeof result?.note === "string" ? result.note : "";
  log(
    `status ${done.status}, measured ${progress.measured} / target ${progress.target}, passed ${progress.passed}, nearMiss ${progress.nearMiss}, failed ${progress.failed}${exhausted ? ` — search exhausted (${note})` : ""}`,
  );
  if (args.includes("--json")) {
    printJson(done);
  }
  if (done.status === "needs_human") {
    log(done.needsHumanReason ?? "Clear the check in Chrome, then rerun.");
    process.exitCode = 2;
  }
  if (done.status === "error") {
    process.exitCode = 1;
  }
  process.exit(process.exitCode ?? 0);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function need(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Missing ${label}`);
  }
  return value;
}

function positional(args: string[]): string | undefined {
  const value = args.find((arg) => !arg.startsWith("--"));
  return value;
}

function flag(args: string[], name: string): string | undefined {
  const index = args.findIndex((arg) => arg === `--${name}`);
  if (index >= 0) {
    return args[index + 1];
  }
  const prefix = `--${name}=`;
  const matched = args.find((arg) => arg.startsWith(prefix));
  return matched ? matched.slice(prefix.length) : undefined;
}

function numFlag(args: string[], name: string): number | undefined {
  const raw = flag(args, name);
  if (raw == null) {
    return undefined;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function csvFlag(args: string[], name: string): string[] {
  const raw = flag(args, name);
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
