import { randomUUID } from "node:crypto";
import { parseFilters } from "../config.ts";
import {
  chromeIsUp,
  connectChrome,
  humanDelay,
  researchPage,
  waitForHumanClear,
} from "../chrome/session.ts";
import {
  bumpProgress,
  createJob,
  createSearch,
  emptyProgress,
  getJob,
  listMeasuredUsernames,
  updateJob,
  upsertAccount,
  upsertPosts,
} from "../db/library.ts";
import { log } from "../log.ts";
import { evaluateAccount } from "../metrics/filters.ts";
import { selectDiscoveryCandidates } from "../tiktok/candidates.ts";
import { downloadSlideshow } from "../tiktok/download.ts";
import { measureProfile } from "../tiktok/profile.ts";
import { openKeywordSearch } from "../tiktok/search.ts";
import {
  CaptchaError,
  ChromeNotRunningError,
  LoginRequiredError,
  type Filters,
  type Job,
} from "../types.ts";

const running = new Map<string, Promise<Job>>();

export function startDiscovery(input: {
  keywords: string;
  target?: number;
  filters?: Record<string, unknown>;
}): Job {
  const target = input.target && input.target > 0 ? Math.floor(input.target) : 20;
  const filters = parseFilters(input.filters);
  const job = createJob({
    id: randomUUID(),
    type: "discovery",
    keywords: input.keywords,
    target,
  });
  const promise = runDiscovery(job.id, input.keywords, target, filters);
  running.set(job.id, promise);
  return updateJob(job.id, { status: "running" });
}

export async function waitForJob(id: string): Promise<Job> {
  const pending = running.get(id);
  if (pending) {
    return pending;
  }
  const job = getJob(id);
  if (!job) {
    throw new Error(`Unknown job ${id}`);
  }
  return job;
}

export { getJob };

async function runDiscovery(id: string, keywords: string, target: number, filters: Filters): Promise<Job> {
  let progress = emptyProgress(target);
  try {
    if (!(await chromeIsUp())) {
      throw new ChromeNotRunningError();
    }
    const session = await connectChrome();
    const page = await researchPage(session);
    const searchId = createSearch(keywords);
    const seen = new Set(listMeasuredUsernames());
    const alreadyInLibrary = seen.size;
    if (alreadyInLibrary > 0) {
      log(`[discover] skipping ${alreadyInLibrary} accounts already in the library`);
    }
    let skippedVideoOnly = 0;
    const terms = keywords
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean);
    for (const term of terms) {
      const search = openKeywordSearch(page, term);
      try {
        while (progress.measured < target && !search.exhausted) {
          const found = await withHumanRetry(id, page, () => search.collectMore());
          upsertPosts(found.posts);
          const photoAuthors = found.posts.filter((post) => post.isSlideshow).map((post) => post.username);
          const selected = selectDiscoveryCandidates(found.accounts, found.posts, seen, photoAuthors, {
            keywords: term,
          });
          for (const skipped of selected.skipped) {
            if (skipped.reason === "video_only" && !seen.has(skipped.username)) {
              seen.add(skipped.username);
              skippedVideoOnly += 1;
              log(`[discover] skip @${skipped.username} video-only in search`);
            }
            if (skipped.reason === "off_niche" && !seen.has(skipped.username)) {
              seen.add(skipped.username);
              log(`[discover] skip @${skipped.username} off-niche in search`);
            }
          }
          const queue = search.exhausted ? [...selected.preferred, ...selected.fallback] : selected.preferred;
          if (queue.length === 0) {
            log(
              `[discover] ${term}: ${selected.preferred.length} slideshow authors so far, scrolling for more`,
            );
            continue;
          }
          for (const account of queue) {
            if (progress.measured >= target) {
              break;
            }
            const username = account.username.toLowerCase();
            if (seen.has(username) || username.length < 2) {
              continue;
            }
            seen.add(username);
            progress = { ...progress, currentUsername: account.username };
            updateJob(id, { status: "running", progress, needsHumanReason: null });
            const snapshot = await withHumanRetry(id, page, () => measureProfile(page, account.username));
            const judged = evaluateAccount(snapshot.metrics, filters, {
              signature: snapshot.account.signature,
              captions: snapshot.posts.map((post) => post.caption),
              keywords,
            });
            upsertAccount({
              ...snapshot.metrics,
              verdict: judged.verdict,
              margin: judged.margin,
              measuredAt: new Date().toISOString(),
              searchId,
              signature: snapshot.account.signature,
            });
            upsertPosts(snapshot.posts);
            progress = bumpProgress(progress, judged.verdict, account.username);
            updateJob(id, { status: "running", progress });
            log(
              `[discover] @${account.username} ${judged.verdict} share=${snapshot.metrics.slideshowShare.toFixed(2)} median=${Math.round(snapshot.metrics.medianViews)}`,
            );
            if (progress.measured >= target) {
              break;
            }
            await humanDelay(1400, 3200);
          }
        }
      } finally {
        search.close();
      }
      if (progress.measured >= target) {
        break;
      }
      log(`[discover] exhausted search for "${term}"`);
    }
    const exhausted = progress.measured < target;
    if (exhausted) {
      log(
        `[discover] measured ${progress.measured} / target ${target} because search exhausted unique slideshow-author candidates`,
      );
    }
    return updateJob(id, {
      status: "done",
      progress,
      result: {
        measured: progress.measured,
        target,
        keywords,
        exhausted,
        alreadyInLibrary,
        skippedVideoOnly,
        note: exhausted
          ? `measured ${progress.measured} because only ${progress.measured} new unique candidates after exhausting search`
          : `measured ${progress.measured} / target ${target}`,
      },
    });
  } catch (error) {
    if (error instanceof CaptchaError || error instanceof LoginRequiredError) {
      return updateJob(id, {
        status: "needs_human",
        progress,
        needsHumanReason: error.message,
      });
    }
    const message = error instanceof Error ? error.message : String(error);
    log(`[discover] error: ${message}`);
    return updateJob(id, { status: "error", progress, error: message });
  } finally {
    running.delete(id);
  }
}

async function withHumanRetry<T>(id: string, page: Parameters<typeof waitForHumanClear>[0], work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (!(error instanceof CaptchaError || error instanceof LoginRequiredError)) {
      throw error;
    }
    updateJob(id, {
      status: "needs_human",
      needsHumanReason: error.message,
    });
    log(`[discover] paused: ${error.message}`);
    await waitForHumanClear(page);
    updateJob(id, { status: "running", needsHumanReason: null });
    return work();
  }
}

export async function runDownload(url: string): Promise<Job> {
  const job = createJob({ id: randomUUID(), type: "download", target: 1 });
  updateJob(job.id, { status: "running" });
  try {
    const session = await connectChrome();
    const page = await session.context.newPage();
    try {
      const result = await downloadSlideshow(page, url);
      return updateJob(job.id, { status: "done", result });
    } finally {
      await page.close();
    }
  } catch (error) {
    if (error instanceof CaptchaError || error instanceof LoginRequiredError) {
      return updateJob(job.id, { status: "needs_human", needsHumanReason: error.message });
    }
    const message = error instanceof Error ? error.message : String(error);
    return updateJob(job.id, { status: "error", error: message });
  }
}
