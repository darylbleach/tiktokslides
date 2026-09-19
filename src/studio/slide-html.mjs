/** Computed tokens from tietheknot.uk (homepage + /wedding-rsvp-uk + /wedding-table-planner). Instagram was login-walled. */
export const TTK_BRAND = {
  cream: "#F7F4EF",
  ink: "#1A1714",
  heading: "#1A202C",
  gold: "#B59E7B",
  goldDeep: "#9E8A68",
  line: "#E8E2D9",
  white: "#FFFFFF",
  muted: "rgba(26, 23, 20, 0.58)",
  playfair: '"Playfair Display", Georgia, serif',
  georgia: "Georgia, 'Times New Roman', serif",
  inter: 'Inter, "Inter Fallback", "Helvetica Neue", Arial, sans-serif',
  wordmark: "Tie The Knot",
  footer: "tietheknot.uk",
  hero: "https://tietheknot.uk/images/homepage-hero.jpg",
  heroAlt: "A couple in wedding clothes outdoors at golden hour",
};

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function widgetFor(options) {
  const kind = options.widget ?? "none";
  if (kind === "guest-list") {
    const rows = options.rows?.length
      ? options.rows
      : [
          ["Mum's colleague", "Maybe"],
          ["Plus one (single & fine)", "No"],
          ["Cousin, last seen at 12", "Maybe"],
          ["Work, not a pint", "No"],
        ];
    const rowHtml = rows
      .map(
        ([name, status]) => `<div class="guest-row">
        <span class="guest-name">${escapeHtml(name)}</span>
        <span class="chip ${status === "No" ? "chip-outline" : ""}">${escapeHtml(status)}</span>
      </div>`,
      )
      .join("");
    return `<section class="product-card">
      <div class="product-head">
        <p class="product-label">Guest list</p>
        <p class="product-meta">${rows.length} names</p>
      </div>
      ${rowHtml}
    </section>`;
  }
  if (kind === "tables") {
    const tables = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"]
      .map(
        (id) => `<div class="table-chip"><span class="table-id">${id}</span><span class="table-n">6 guests</span></div>`,
      )
      .join("");
    return `<section class="product-card">
      <div class="product-head">
        <p class="product-label">Table planner</p>
        <p class="product-meta">78 guests seated</p>
      </div>
      <div class="top-table">Top table</div>
      <div class="table-grid">${tables}</div>
    </section>`;
  }
  if (kind === "feature") {
    const title = options.cardTitle ?? "";
    const body = options.cardBody ?? "";
    return `<section class="product-card feature-card">
      ${options.number ? `<p class="card-index">${escapeHtml(options.number)}</p>` : ""}
      <h2 class="card-title">${escapeHtml(title)}</h2>
      ${body ? `<p class="card-body">${escapeHtml(body)}</p>` : ""}
    </section>`;
  }
  return "";
}

function chromeNav() {
  return `<nav class="nav">
    <a class="wordmark">${escapeHtml(TTK_BRAND.wordmark)}</a>
    <a class="btn-fill">Start free</a>
  </nav>`;
}

function chromePills(secondary = TTK_BRAND.footer) {
  return `<div class="pills">
    <a class="btn-fill">Start free</a>
    <a class="btn-outline">${escapeHtml(secondary)}</a>
  </div>`;
}

/**
 * @param {string} headline
 * @param {string} [body]
 * @param {string} [kicker]
 * @param {{ kind?: "cover" | "point" | "hook"; number?: string; eyebrow?: string; widget?: string; rows?: string[][]; cardTitle?: string; cardBody?: string }} [options]
 */
export function buildSlideHtml(headline, body = "", kicker = "", options = {}) {
  const kind = options.kind ?? (options.number ? "point" : body ? "cover" : "cover");
  const number = options.number ?? "";
  const eyebrow = options.eyebrow ?? "";
  void kicker;

  const widget = widgetFor({ ...options, eyebrow, number });
  const hero =
    kind === "cover"
      ? `<div class="hero"><img src="${TTK_BRAND.hero}" alt="${escapeHtml(TTK_BRAND.heroAlt)}" /></div>`
      : "";
  const count = kind === "cover" && body ? `<p class="lede">${escapeHtml(body)}</p>` : "";
  const hookBody = kind === "hook" && body ? `<p class="lede">${escapeHtml(body)}</p>` : "";
  const pointCard =
    kind === "point"
      ? widget ||
        widgetFor({
          widget: "feature",
          eyebrow,
          number,
          cardTitle: headline,
          cardBody: body,
        })
      : widget;

  const headlineHtml =
    kind === "point"
      ? ""
      : `<h1>${escapeHtml(headline)}</h1>`;

  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=block" rel="stylesheet" />
  <style>
    :root {
      --cream: ${TTK_BRAND.cream};
      --ink: ${TTK_BRAND.ink};
      --heading: ${TTK_BRAND.heading};
      --gold: ${TTK_BRAND.gold};
      --gold-deep: ${TTK_BRAND.goldDeep};
      --line: ${TTK_BRAND.line};
      --white: ${TTK_BRAND.white};
      --muted: ${TTK_BRAND.muted};
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
      font-family: ${TTK_BRAND.inter};
      -webkit-font-smoothing: antialiased;
    }
    .page {
      box-sizing: border-box;
      width: 1080px;
      height: 1920px;
      background: var(--cream);
      display: flex;
      flex-direction: column;
    }
    .nav {
      flex: 0 0 96px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 48px;
      background: rgba(247, 244, 239, 0.95);
      border-bottom: 1px solid rgba(181, 158, 123, 0.2);
    }
    .wordmark {
      font-family: ${TTK_BRAND.playfair};
      font-size: 32px;
      font-weight: 400;
      letter-spacing: -0.8px;
      line-height: 1;
      color: var(--ink);
      text-decoration: none;
    }
    .btn-fill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--gold);
      color: var(--white);
      font-family: ${TTK_BRAND.inter};
      font-size: 22px;
      font-weight: 500;
      line-height: 1;
      padding: 16px 28px;
      border-radius: 999px;
      text-decoration: none;
      border: 0;
    }
    .btn-outline {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      color: var(--gold);
      font-family: ${TTK_BRAND.inter};
      font-size: 22px;
      font-weight: 500;
      line-height: 1;
      padding: 16px 28px;
      border-radius: 999px;
      text-decoration: none;
      border: 1px solid var(--gold);
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .copy {
      padding: 56px 56px 32px;
    }
    .cover .copy { padding: 48px 56px 28px; }
    .hook .copy { padding: 48px 56px 24px; }
    .point .copy {
      flex: 0 0 auto;
      padding: 48px 56px 16px;
    }
    .eyebrow {
      margin: 0 0 20px;
      font-size: 22px;
      font-weight: 400;
      letter-spacing: 0.56px;
      line-height: 1.2;
      text-transform: uppercase;
      color: var(--gold);
    }
    h1 {
      margin: 0;
      font-family: ${TTK_BRAND.playfair};
      font-size: 72px;
      font-weight: 400;
      line-height: 1.06;
      letter-spacing: -1.8px;
      color: var(--ink);
      text-wrap: pretty;
    }
    .hook h1 { font-size: 64px; letter-spacing: -1.4px; }
    .lede {
      margin: 28px 0 0;
      font-size: 28px;
      font-weight: 400;
      line-height: 1.45;
      color: var(--muted);
      max-width: 920px;
      text-wrap: pretty;
    }
    .pills {
      display: flex;
      gap: 16px;
      margin-top: 36px;
      flex-wrap: wrap;
    }
    .hero {
      flex: 1;
      min-height: 720px;
      overflow: hidden;
    }
    .hero img {
      display: block;
      width: 1080px;
      height: 100%;
      object-fit: cover;
      object-position: center 30%;
    }
    .product-card {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1);
      padding: 28px 32px;
      margin: 0 56px 28px;
    }
    .point .product-card {
      margin: 0 56px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 48px 44px;
    }
    .hook .product-card {
      flex: 1;
      margin: 8px 56px 56px;
    }
    .product-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    .product-label {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--gold);
    }
    .product-meta {
      margin: 0;
      font-size: 20px;
      font-weight: 400;
      color: var(--muted);
    }
    .guest-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 18px 0;
      border-top: 1px solid var(--line);
    }
    .guest-name {
      font-size: 26px;
      font-weight: 500;
      color: var(--ink);
    }
    .chip {
      flex: 0 0 auto;
      font-size: 18px;
      font-weight: 500;
      color: var(--white);
      background: var(--gold);
      border-radius: 999px;
      padding: 8px 16px;
    }
    .chip-outline {
      background: transparent;
      color: var(--gold);
      border: 1px solid var(--gold);
    }
    .top-table {
      background: var(--cream);
      border: 1px solid var(--line);
      border-radius: 16px;
      text-align: center;
      font-size: 24px;
      font-weight: 500;
      padding: 18px;
      margin-bottom: 16px;
      color: var(--ink);
    }
    .table-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 12px;
    }
    .table-chip {
      background: var(--cream);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 16px 8px;
      text-align: center;
    }
    .table-id { display: block; font-size: 22px; font-weight: 600; color: var(--ink); }
    .table-n { display: block; font-size: 16px; color: var(--muted); margin-top: 4px; }
    .card-index {
      margin: 0 0 16px;
      font-size: 22px;
      font-weight: 500;
      letter-spacing: 0.08em;
      color: var(--gold);
    }
    .card-title {
      margin: 0;
      font-family: ${TTK_BRAND.inter};
      font-size: 48px;
      font-weight: 500;
      line-height: 1.2;
      letter-spacing: -0.3px;
      color: var(--heading);
      text-wrap: pretty;
    }
    .card-body {
      margin: 20px 0 0;
      font-size: 28px;
      line-height: 1.4;
      color: var(--muted);
    }
    .foot {
      padding: 8px 56px 40px;
    }
  </style>
</head>
<body>
  <div class="page ${kind}">
    ${chromeNav()}
    <div class="main">
      <div class="copy">
        ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
        ${headlineHtml}
        ${count}
        ${hookBody}
        ${kind !== "point" ? chromePills() : ""}
      </div>
      ${hero}
      ${pointCard}
      ${kind === "point" ? `<div class="foot">${chromePills()}</div>` : ""}
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
          widget: "tables",
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
          widget: "feature",
          cardTitle: bullet,
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
      document.fonts.load('72px "Playfair Display"'),
      document.fonts.load("32px Inter"),
      document.fonts.load("48px Inter"),
    ]);
    await Promise.all(
      [...document.images].map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      }),
    );
  });
}
