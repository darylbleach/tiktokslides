import { chromium, type Browser, type BrowserContext, type Page, type Response } from "playwright";
import { cdpUrl } from "../paths.ts";
import { CaptchaError, ChromeNotRunningError, LoginRequiredError } from "../types.ts";

const CAPTCHA_TEXT = [
  "verify to continue",
  "please verify",
  "security check",
  "unusual traffic",
  "complete the captcha",
  "slide to verify",
  "drag the puzzle",
];

export type ChromeSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
};

export async function connectChrome(): Promise<ChromeSession> {
  let browser: Browser;
  try {
    browser = await chromium.connectOverCDP(cdpUrl());
  } catch {
    throw new ChromeNotRunningError();
  }
  const context = browser.contexts()[0];
  if (!context) {
    throw new ChromeNotRunningError();
  }
  const page = context.pages()[0] ?? (await context.newPage());
  return { browser, context, page };
}

export async function researchPage(session: ChromeSession): Promise<Page> {
  const existing = session.context.pages().find((page) => page.url().includes("tiktok.com"));
  return existing ?? session.page;
}

export async function humanDelay(minMs = 900, maxMs = 2400): Promise<void> {
  const span = Math.max(maxMs - minMs, 1);
  const ms = minMs + Math.random() * span;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function attachJsonSniffer(page: Page, bucket: unknown[]): () => void {
  const onResponse = async (response: Response) => {
    const url = response.url();
    if (!/tiktok\.com\/(api|aweme)\//i.test(url)) {
      return;
    }
    const contentType = response.headers()["content-type"] ?? "";
    if (!contentType.includes("json") && !contentType.includes("javascript")) {
      return;
    }
    try {
      bucket.push(await response.json());
    } catch {
      // Ignore empty or non-JSON bodies.
    }
  };
  page.on("response", onResponse);
  return () => page.off("response", onResponse);
}

export async function detectCaptcha(page: Page): Promise<boolean> {
  const url = page.url().toLowerCase();
  if (url.includes("captcha") || url.includes("verify")) {
    return true;
  }
  return page.evaluate((needles) => {
    const frameHit = [...document.querySelectorAll("iframe")].some((frame) => {
      const src = (frame.getAttribute("src") ?? "").toLowerCase();
      return src.includes("captcha") || src.includes("verify");
    });
    if (frameHit || document.querySelector("#tiktok-verify-ele, [class*='captcha']")) {
      return true;
    }
    const text = (document.body?.innerText ?? "").toLowerCase();
    return needles.some((needle) => text.includes(needle));
  }, CAPTCHA_TEXT);
}

export async function detectLoginWall(page: Page): Promise<boolean> {
  const url = page.url().toLowerCase();
  if (url.includes("/login") || url.includes("/signup")) {
    return true;
  }
  return page.evaluate(() => {
    const text = (document.body?.innerText ?? "").toLowerCase();
    const loginForm = Boolean(document.querySelector('input[type="password"], form[action*="login"]'));
    return loginForm && (text.includes("log in to continue") || text.includes("log in to tiktok"));
  });
}

export async function assertReadable(page: Page): Promise<void> {
  if (await detectCaptcha(page)) {
    throw new CaptchaError();
  }
  if (await detectLoginWall(page)) {
    throw new LoginRequiredError();
  }
}

export async function waitForHumanClear(page: Page, timeoutMs = 15 * 60 * 1000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await humanDelay(2500, 4000);
    if (!(await detectCaptcha(page)) && !(await detectLoginWall(page))) {
      return;
    }
  }
  if (await detectCaptcha(page)) {
    throw new CaptchaError();
  }
  throw new LoginRequiredError();
}

export async function gentleScroll(page: Page, times = 3): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await page.mouse.wheel(0, 700 + Math.floor(Math.random() * 500));
    await humanDelay(700, 1600);
  }
}

export async function gotoHuman(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await humanDelay(800, 1600);
  await assertReadable(page);
}

export async function chromeIsUp(): Promise<boolean> {
  try {
    const response = await fetch(`${cdpUrl()}/json/version`);
    return response.ok;
  } catch {
    return false;
  }
}
