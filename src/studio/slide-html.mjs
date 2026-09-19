/** Tie The Knot brand tokens from tietheknot.uk (Instagram was login-walled). */
export const TTK_BRAND = {
  cream: "#F7F4EF",
  ink: "#1A1714",
  gold: "#B59E7B",
  goldDeep: "#9E8A68",
  line: "#E8E2D9",
  display: '"Playfair Display", Georgia, "Times New Roman", serif',
  sans: 'Inter, "Helvetica Neue", Arial, sans-serif',
  wordmark: "Tie The Knot",
  footer: "tietheknot.uk",
};

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * @param {string} headline
 * @param {string} [body]
 * @param {string} [kicker] ignored when it is the old "List" label; wordmark is always Tie The Knot
 * @param {{ kind?: "cover" | "point" | "hook"; number?: string; eyebrow?: string }} [options]
 */
export function buildSlideHtml(headline, body = "", kicker = "", options = {}) {
  const kind = options.kind ?? (options.number ? "point" : body ? "cover" : "cover");
  const number = options.number ?? "";
  const eyebrow = options.eyebrow ?? "";
  const wordmark = TTK_BRAND.wordmark;
  void kicker;

  const count = kind === "cover" && body ? escapeHtml(body) : "";
  const bodyHtml = kind !== "cover" && body ? `<p class="body">${escapeHtml(body)}</p>` : "";
  const numberHtml = number ? `<div class="number">${escapeHtml(number)}</div>` : "";
  const eyebrowHtml = eyebrow
    ? `<div class="eyebrow">${escapeHtml(eyebrow)}</div>`
    : "";
  const ruleHtml = kind === "point" ? "" : `<div class="rule"></div>`;

  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=block" rel="stylesheet" />
  <style>
    :root {
      --cream: ${TTK_BRAND.cream};
      --ink: ${TTK_BRAND.ink};
      --gold: ${TTK_BRAND.gold};
      --gold-deep: ${TTK_BRAND.goldDeep};
      --line: ${TTK_BRAND.line};
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 1080px;
      height: 1920px;
      background: var(--cream);
    }
    body {
      color: var(--ink);
      font-family: ${TTK_BRAND.sans};
      -webkit-font-smoothing: antialiased;
    }
    .frame {
      box-sizing: border-box;
      width: 1080px;
      height: 1920px;
      padding: 56px 48px 48px;
    }
    .inner {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      border: 1px solid rgba(181, 158, 123, 0.38);
      padding: 72px 72px 56px;
      display: flex;
      flex-direction: column;
    }
    .mast {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
    }
    .wordmark {
      margin: 0;
      font-family: ${TTK_BRAND.display};
      font-size: 40px;
      font-weight: 400;
      letter-spacing: -0.03em;
      line-height: 1;
      color: var(--ink);
    }
    .eyebrow {
      margin-top: 56px;
      font-size: 24px;
      font-weight: 500;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--gold);
    }
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 24px 0 80px;
    }
    .content.point {
      justify-content: flex-end;
      padding-bottom: 120px;
    }
    .number {
      font-family: ${TTK_BRAND.display};
      font-size: 128px;
      font-weight: 400;
      line-height: 0.85;
      letter-spacing: -0.04em;
      color: var(--gold);
      margin: 0 0 28px;
    }
    h1 {
      margin: 0;
      max-width: 860px;
      font-family: ${TTK_BRAND.display};
      font-size: 84px;
      font-weight: 400;
      line-height: 1.07;
      letter-spacing: -0.03em;
      color: var(--ink);
    }
    .point h1 {
      font-size: 58px;
      line-height: 1.14;
      letter-spacing: -0.02em;
    }
    .rule {
      width: 64px;
      height: 1px;
      background: var(--gold);
      margin: 40px 0 36px;
    }
    .count {
      margin: 0;
      font-size: 32px;
      font-weight: 500;
      letter-spacing: 0.04em;
      color: var(--gold-deep);
    }
    .body {
      margin: 0;
      max-width: 820px;
      font-size: 38px;
      font-weight: 400;
      line-height: 1.4;
      color: rgba(26, 23, 20, 0.64);
    }
    .footer {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    .footer-rule {
      flex: 1;
      height: 1px;
      background: rgba(181, 158, 123, 0.35);
    }
    .footer-url {
      font-size: 24px;
      font-weight: 500;
      letter-spacing: 0.06em;
      color: var(--gold-deep);
    }
  </style>
</head>
<body>
  <div class="frame">
    <div class="inner">
      <div class="mast">
        <p class="wordmark">${escapeHtml(wordmark)}</p>
        ${eyebrowHtml}
      </div>
      <div class="content ${kind}">
        ${numberHtml}
        <h1>${escapeHtml(headline)}</h1>
        ${ruleHtml}
        ${count ? `<p class="count">${count}</p>` : ""}
        ${bodyHtml}
      </div>
      <div class="footer">
        <div class="footer-rule"></div>
        <div class="footer-url">${escapeHtml(TTK_BRAND.footer)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * @param {{ headline: string; bullets?: string[]; layout: "hook" | "numbered_list"; eyebrow?: string }} input
 */
export function slidesFor(input) {
  const bullets = (input.bullets ?? []).map((item) => item.trim()).filter(Boolean);
  const eyebrow = input.eyebrow ?? "";
  if (input.layout === "hook") {
    return [
      {
        name: "01.png",
        html: buildSlideHtml(input.headline, bullets[0] ?? "", TTK_BRAND.wordmark, {
          kind: "hook",
          eyebrow,
        }),
      },
    ];
  }
  if (input.layout === "numbered_list") {
    const slides = [
      {
        name: "01.png",
        html: buildSlideHtml(input.headline, bullets.length ? `${bullets.length} things` : "", TTK_BRAND.wordmark, {
          kind: "cover",
          eyebrow,
        }),
      },
    ];
    bullets.forEach((bullet, index) => {
      slides.push({
        name: `${String(index + 2).padStart(2, "0")}.png`,
        html: buildSlideHtml(bullet, "", TTK_BRAND.wordmark, {
          kind: "point",
          number: String(index + 1).padStart(2, "0"),
          eyebrow,
        }),
      });
    });
    return slides;
  }
  throw new Error(`Unknown layout: ${input.layout}`);
}

/** @param {import("playwright").Page} page */
export async function waitForSlideReady(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load('48px "Playfair Display"'),
      document.fonts.load('32px Inter'),
    ]);
  });
}
