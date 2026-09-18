import { parseFilters } from "./config.ts";
import { getAccount, getJob, listFormats, listLibrary, nameFormat } from "./db/library.ts";
import { startDiscovery, runDownload, waitForJob } from "./jobs/runner.ts";
import { connectChrome, researchPage } from "./chrome/session.ts";
import { measureProfile } from "./tiktok/profile.ts";
import { evaluateAccount } from "./metrics/filters.ts";
import { upsertAccount, upsertPosts } from "./db/library.ts";
import { renderDraft, type DraftLayout } from "./studio/render.ts";
import type { Filters, Job, NamedFormat, StoredAccount, Verdict } from "./types.ts";

export function startDiscoveryJob(keywords: string, target = 20, filters?: Record<string, unknown>): Job {
  return startDiscovery({ keywords, target, filters });
}

export function readJob(id: string): Job {
  const job = getJob(id);
  if (!job) {
    throw new Error(`Unknown job ${id}`);
  }
  return job;
}

export { waitForJob };

export function listLibraryAccounts(input: {
  niche?: string;
  verdict?: Verdict;
  minViews?: number;
}): StoredAccount[] {
  return listLibrary(input);
}

export async function readAccount(username: string, liveFallback = false) {
  const stored = getAccount(username);
  if (stored || !liveFallback) {
    return stored;
  }
  const session = await connectChrome();
  const page = await researchPage(session);
  const snapshot = await measureProfile(page, username);
  const judged = evaluateAccount(snapshot.metrics, parseFilters(undefined));
  const record = {
    ...snapshot.metrics,
    verdict: judged.verdict,
    margin: judged.margin,
    measuredAt: new Date().toISOString(),
    searchId: null,
    signature: snapshot.account.signature,
  };
  upsertAccount(record);
  upsertPosts(snapshot.posts);
  return getAccount(username);
}

export async function downloadSlideshowJob(url: string): Promise<Job> {
  return runDownload(url);
}

export function persistFormat(input: {
  name: string;
  notes?: string;
  examplePostIds?: string[];
  exampleUrls?: string[];
}): NamedFormat {
  const fromUrls = (input.exampleUrls ?? [])
    .map((url) => url.match(/\/(photo|video)\/(\d+)/)?.[2] ?? "")
    .filter(Boolean);
  const examplePostIds = [...new Set([...(input.examplePostIds ?? []), ...fromUrls])];
  return nameFormat(input.name, input.notes ?? "", examplePostIds);
}

export function readFormats(): NamedFormat[] {
  return listFormats();
}

export async function renderDraftJob(input: {
  headline: string;
  bullets?: string[];
  layout: DraftLayout;
}) {
  return renderDraft(input);
}

export type { Filters };
