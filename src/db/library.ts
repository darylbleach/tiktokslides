import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { DATA_DIR, DB_PATH } from "../paths.ts";
import type {
  Filters,
  Job,
  JobProgress,
  JobStatus,
  NamedFormat,
  StoredAccount,
  TikTokPost,
  Verdict,
} from "../types.ts";

export type LibraryQuery = {
  niche?: string;
  verdict?: Verdict;
  minViews?: number;
};

export type AccountRecord = StoredAccount & {
  posts: TikTokPost[];
};

let singleton: Database.Database | null = null;

export function openLibrary(dbPath = DB_PATH): Database.Database {
  if (dbPath !== ":memory:") {
    mkdirSync(dirname(dbPath), { recursive: true });
    mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

export function getDb(): Database.Database {
  if (!singleton) {
    singleton = openLibrary();
  }
  return singleton;
}

export function resetDbForTests(db: Database.Database): void {
  singleton = db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keywords TEXT NOT NULL,
      niche TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accounts (
      username TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      followers INTEGER NOT NULL,
      post_count INTEGER NOT NULL,
      slideshow_count INTEGER NOT NULL,
      slideshow_share REAL NOT NULL,
      median_views REAL NOT NULL,
      views_per_follower REAL NOT NULL,
      posts_per_week REAL NOT NULL,
      hashtags TEXT NOT NULL,
      verdict TEXT NOT NULL,
      margin REAL NOT NULL,
      measured_at TEXT NOT NULL,
      search_id INTEGER,
      signature TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      url TEXT NOT NULL,
      caption TEXT NOT NULL,
      views INTEGER NOT NULL,
      likes INTEGER NOT NULL,
      is_slideshow INTEGER NOT NULL,
      slide_count INTEGER NOT NULL,
      create_time INTEGER NOT NULL,
      hashtags TEXT NOT NULL,
      cover_url TEXT,
      image_urls TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS formats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      notes TEXT NOT NULL,
      example_post_ids TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      keywords TEXT,
      progress TEXT NOT NULL,
      needs_human_reason TEXT,
      error TEXT,
      result TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_accounts_verdict ON accounts(verdict);
    CREATE INDEX IF NOT EXISTS idx_posts_username ON posts(username);
  `);
}

export function createSearch(keywords: string, niche = keywords): number {
  const info = getDb()
    .prepare("INSERT INTO searches (keywords, niche, created_at) VALUES (?, ?, ?)")
    .run(keywords, niche, now());
  return Number(info.lastInsertRowid);
}

export function upsertAccount(account: StoredAccount): void {
  getDb()
    .prepare(
      `INSERT INTO accounts (
        username, nickname, followers, post_count, slideshow_count, slideshow_share,
        median_views, views_per_follower, posts_per_week, hashtags, verdict, margin,
        measured_at, search_id, signature
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        nickname = excluded.nickname,
        followers = excluded.followers,
        post_count = excluded.post_count,
        slideshow_count = excluded.slideshow_count,
        slideshow_share = excluded.slideshow_share,
        median_views = excluded.median_views,
        views_per_follower = excluded.views_per_follower,
        posts_per_week = excluded.posts_per_week,
        hashtags = excluded.hashtags,
        verdict = excluded.verdict,
        margin = excluded.margin,
        measured_at = excluded.measured_at,
        search_id = excluded.search_id,
        signature = excluded.signature`,
    )
    .run(
      account.username,
      account.nickname,
      account.followers,
      account.postCount,
      account.slideshowCount,
      account.slideshowShare,
      account.medianViews,
      account.viewsPerFollower,
      account.postsPerWeek,
      JSON.stringify(account.hashtags),
      account.verdict,
      account.margin,
      account.measuredAt,
      account.searchId,
      account.signature,
    );
}

export function upsertPosts(posts: TikTokPost[]): void {
  const stmt = getDb().prepare(
    `INSERT INTO posts (
      id, username, url, caption, views, likes, is_slideshow, slide_count,
      create_time, hashtags, cover_url, image_urls
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      views = excluded.views,
      likes = excluded.likes,
      is_slideshow = excluded.is_slideshow,
      slide_count = excluded.slide_count,
      caption = excluded.caption,
      image_urls = excluded.image_urls`,
  );
  const tx = getDb().transaction((rows: TikTokPost[]) => {
    for (const post of rows) {
      stmt.run(
        post.id,
        post.username,
        post.url,
        post.caption,
        post.views,
        post.likes,
        post.isSlideshow ? 1 : 0,
        post.slideCount,
        post.createTime,
        JSON.stringify(post.hashtags),
        post.coverUrl,
        JSON.stringify(post.imageUrls),
      );
    }
  });
  tx(posts);
}

export function listMeasuredUsernames(): string[] {
  const rows = getDb().prepare("SELECT username FROM accounts").all() as Array<{ username: string }>;
  return rows.map((row) => row.username.toLowerCase());
}

export function listLibrary(query: LibraryQuery = {}): StoredAccount[] {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (query.verdict) {
    clauses.push("a.verdict = ?");
    params.push(query.verdict);
  }
  if (query.minViews != null) {
    clauses.push("a.median_views >= ?");
    params.push(query.minViews);
  }
  if (query.niche) {
    clauses.push(
      "(COALESCE(s.niche, s.keywords, '') LIKE ? OR a.hashtags LIKE ? OR a.username LIKE ?)",
    );
    const like = `%${query.niche}%`;
    params.push(like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDb()
    .prepare(
      `SELECT a.*, s.niche AS niche
       FROM accounts a
       LEFT JOIN searches s ON s.id = a.search_id
       ${where}
       ORDER BY a.median_views DESC`,
    )
    .all(...params) as Array<Record<string, unknown>>;
  return rows.map(rowToAccount);
}

export function getAccount(username: string): AccountRecord | null {
  const row = getDb()
    .prepare("SELECT * FROM accounts WHERE username = ? COLLATE NOCASE")
    .get(username.replace(/^@/, "")) as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  const posts = (
    getDb()
      .prepare("SELECT * FROM posts WHERE username = ? COLLATE NOCASE ORDER BY create_time DESC")
      .all(row.username) as Array<Record<string, unknown>>
  ).map(rowToPost);
  return { ...rowToAccount(row), posts };
}

export function nameFormat(name: string, notes: string, examplePostIds: string[]): NamedFormat {
  const createdAt = now();
  const info = getDb()
    .prepare("INSERT INTO formats (name, notes, example_post_ids, created_at) VALUES (?, ?, ?, ?)")
    .run(name, notes, JSON.stringify(examplePostIds), createdAt);
  return {
    id: Number(info.lastInsertRowid),
    name,
    notes,
    examplePostIds,
    createdAt,
  };
}

export function listFormats(): NamedFormat[] {
  const rows = getDb()
    .prepare("SELECT * FROM formats ORDER BY id DESC")
    .all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    notes: String(row.notes),
    examplePostIds: JSON.parse(String(row.example_post_ids)) as string[],
    createdAt: String(row.created_at),
  }));
}

export function createJob(input: {
  id: string;
  type: Job["type"];
  keywords?: string | null;
  target: number;
}): Job {
  const createdAt = now();
  const progress: JobProgress = {
    measured: 0,
    target: input.target,
    passed: 0,
    nearMiss: 0,
    failed: 0,
    currentUsername: null,
  };
  const job: Job = {
    id: input.id,
    type: input.type,
    status: "queued",
    keywords: input.keywords ?? null,
    progress,
    needsHumanReason: null,
    error: null,
    result: null,
    createdAt,
    updatedAt: createdAt,
  };
  getDb()
    .prepare(
      `INSERT INTO jobs (id, type, status, keywords, progress, needs_human_reason, error, result, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      job.id,
      job.type,
      job.status,
      job.keywords,
      JSON.stringify(job.progress),
      null,
      null,
      null,
      job.createdAt,
      job.updatedAt,
    );
  return job;
}

export function updateJob(
  id: string,
  patch: Partial<Pick<Job, "status" | "progress" | "needsHumanReason" | "error" | "result">>,
): Job {
  const current = getJob(id);
  if (!current) {
    throw new Error(`Unknown job ${id}`);
  }
  const next: Job = {
    ...current,
    ...patch,
    updatedAt: now(),
  };
  getDb()
    .prepare(
      `UPDATE jobs SET status = ?, progress = ?, needs_human_reason = ?, error = ?, result = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      next.status,
      JSON.stringify(next.progress),
      next.needsHumanReason,
      next.error,
      next.result == null ? null : JSON.stringify(next.result),
      next.updatedAt,
      id,
    );
  return next;
}

export function getJob(id: string): Job | null {
  const row = getDb().prepare("SELECT * FROM jobs WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToJob(row) : null;
}

export function emptyProgress(target: number): JobProgress {
  return {
    measured: 0,
    target,
    passed: 0,
    nearMiss: 0,
    failed: 0,
    currentUsername: null,
  };
}

export function bumpProgress(progress: JobProgress, verdict: Verdict, username: string): JobProgress {
  return {
    ...progress,
    measured: progress.measured + 1,
    passed: progress.passed + (verdict === "passed" ? 1 : 0),
    nearMiss: progress.nearMiss + (verdict === "near_miss" ? 1 : 0),
    failed: progress.failed + (verdict === "failed" ? 1 : 0),
    currentUsername: username,
  };
}

function rowToAccount(row: Record<string, unknown>): StoredAccount {
  return {
    username: String(row.username),
    nickname: String(row.nickname),
    followers: Number(row.followers),
    postCount: Number(row.post_count),
    slideshowCount: Number(row.slideshow_count),
    slideshowShare: Number(row.slideshow_share),
    medianViews: Number(row.median_views),
    viewsPerFollower: Number(row.views_per_follower),
    postsPerWeek: Number(row.posts_per_week),
    hashtags: JSON.parse(String(row.hashtags)) as string[],
    verdict: row.verdict as Verdict,
    margin: Number(row.margin),
    measuredAt: String(row.measured_at),
    searchId: row.search_id == null ? null : Number(row.search_id),
    signature: String(row.signature ?? ""),
  };
}

function rowToPost(row: Record<string, unknown>): TikTokPost {
  return {
    id: String(row.id),
    username: String(row.username),
    url: String(row.url),
    caption: String(row.caption),
    views: Number(row.views),
    likes: Number(row.likes),
    isSlideshow: Number(row.is_slideshow) === 1,
    slideCount: Number(row.slide_count),
    createTime: Number(row.create_time),
    hashtags: JSON.parse(String(row.hashtags)) as string[],
    coverUrl: row.cover_url == null ? null : String(row.cover_url),
    imageUrls: JSON.parse(String(row.image_urls)) as string[],
  };
}

function rowToJob(row: Record<string, unknown>): Job {
  return {
    id: String(row.id),
    type: row.type as Job["type"],
    status: row.status as JobStatus,
    keywords: row.keywords == null ? null : String(row.keywords),
    progress: JSON.parse(String(row.progress)) as JobProgress,
    needsHumanReason: row.needs_human_reason == null ? null : String(row.needs_human_reason),
    error: row.error == null ? null : String(row.error),
    result: row.result == null ? null : JSON.parse(String(row.result)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function now(): string {
  return new Date().toISOString();
}

export type { Filters };
