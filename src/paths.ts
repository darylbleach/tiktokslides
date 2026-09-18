import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(here, "..");
export const DATA_DIR = path.join(PROJECT_ROOT, "data");
export const DOWNLOAD_DIR = path.join(DATA_DIR, "downloads");
export const DRAFT_DIR = path.join(DATA_DIR, "drafts");
export const DB_PATH = path.join(DATA_DIR, "library.sqlite");

export function cdpPort(): string {
  return process.env.SLIDE_RESEARCH_CDP_PORT ?? process.env.TIKTOKSLIDES_CDP_PORT ?? "9222";
}

export function cdpUrl(): string {
  return `http://127.0.0.1:${cdpPort()}`;
}
