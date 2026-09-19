/** Tie The Knot tokens from tietheknot.uk: Playfair wordmark, Inter UI, cream/ink/gold. Not the rejected invitation-card frame. */
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
      <div class="top-table">
        <span class="top-label">Top table</span>
        <span class="top-names">Rebecca · Samantha</span>
        <span class="top-names">Graham · Charlotte</span>
      </div>
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

function heroHtml(src, alt, position) {
  if (!src) return "";
  const pos = position ? ` style="--photo-pos: ${escapeHtml(position)}"` : "";
  return `<div class="hero"${pos}><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" /></div>`;
}

/**
 * @param {string} headline
 * @param {string} [body]
 * @param {string} [kicker]
 * @param {{ kind?: "cover" | "point" | "hook"; number?: string; eyebrow?: string; widget?: string; rows?: string[][]; cardTitle?: string; cardBody?: string; photoSrc?: string; photoAlt?: string }} [options]
 */
export function buildSlideHtml(headline, body = "", kicker = "", options = {}) {
  const kind = options.kind ?? (options.number ? "point" : body ? "cover" : "cover");
  const number = options.number ?? "";
  const eyebrow = options.eyebrow ?? "";
  void kicker;

  const photoSrc =
    options.photoSrc ?? (kind === "cover" || kind === "hook" ? TTK_BRAND.hero : "");
  const photoAlt = options.photoAlt ?? TTK_BRAND.heroAlt;
  const hero = heroHtml(photoSrc, photoAlt, options.photoPosition);

  const widget = widgetFor({ ...options, eyebrow, number });
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

  const headlineHtml = kind === "point" ? "" : `<h1>${escapeHtml(headline)}</h1>`;

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
      font-size: 28px;
      font-weight: 400;
      letter-spacing: -0.7px;
      line-height: 1;
      color: var(--ink);
      text-decoration: none;
    }
    .nav .btn-fill {
      font-size: 18px;
      padding: 12px 22px;
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
      padding: 48px 56px 28px;
    }
    .cover .copy { padding: 48px 56px 28px; }
    .hook .copy { padding: 40px 56px 20px; }
    .point .copy {
      flex: 0 0 auto;
      padding: 32px 56px 12px;
    }
    .eyebrow {
      margin: 0 0 20px;
      font-size: 22px;
      font-weight: 500;
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
    .hook h1 { font-size: 58px; letter-spacing: -1.4px; }
    .lede {
      margin: 24px 0 0;
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
      margin-top: 28px;
      flex-wrap: wrap;
    }
    .hero {
      overflow: hidden;
      background: #d9d0c4;
    }
    .cover .hero {
      flex: 1;
      min-height: 720px;
    }
    .hook .hero {
      flex: 1;
      min-height: 420px;
    }
    .point .hero {
      flex: 1;
      min-height: 720px;
    }
    .hero img {
      display: block;
      width: 1080px;
      height: 100%;
      object-fit: cover;
      object-position: var(--photo-pos, center 30%);
    }
    .product-card {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      padding: 28px 32px;
      margin: 0 56px 24px;
    }
    .point .stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 56px 8px;
      flex: 0 0 auto;
    }
    .point .product-card {
      margin: 0;
      flex: 0 0 auto;
      padding: 28px 32px;
    }
    .hook .product-card {
      flex: 0 0 auto;
      margin: 16px 56px 16px;
    }
    .product-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
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
      padding: 16px 0;
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
      padding: 16px;
      margin-bottom: 14px;
      color: var(--ink);
    }
    .top-label {
      display: block;
      font-size: 18px;
      font-weight: 500;
      color: var(--gold);
      letter-spacing: 0.4px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .top-names {
      display: block;
      font-size: 22px;
      font-weight: 500;
      line-height: 1.35;
    }
    .table-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 10px;
    }
    .table-chip {
      background: var(--cream);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 12px 8px;
      text-align: center;
    }
    .table-id { display: block; font-size: 20px; font-weight: 600; color: var(--ink); }
    .table-n { display: block; font-size: 15px; color: var(--muted); margin-top: 4px; }
    .card-index {
      margin: 0 0 12px;
      font-size: 22px;
      font-weight: 500;
      letter-spacing: 0.08em;
      color: var(--gold);
    }
    .card-title {
      margin: 0;
      font-family: ${TTK_BRAND.inter};
      font-size: 40px;
      font-weight: 500;
      line-height: 1.25;
      letter-spacing: -0.2px;
      color: var(--heading);
      text-wrap: pretty;
    }
    .card-body {
      margin: 16px 0 0;
      font-size: 28px;
      line-height: 1.4;
      color: var(--muted);
    }
    .site-foot {
      margin-top: auto;
      padding: 24px 56px 32px;
      border-top: 1px solid rgba(181, 158, 123, 0.2);
    }
    .site-foot .wordmark { font-size: 28px; }
    .site-foot p {
      margin: 10px 0 0;
      font-size: 20px;
      color: var(--muted);
      max-width: 720px;
    }
    .site-foot a {
      display: inline-block;
      margin-top: 10px;
      color: var(--gold);
      font-size: 20px;
      text-decoration: none;
    }
    .foot {
      padding: 8px 56px 28px;
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
      ${
        kind === "point"
          ? `<div class="stack">${pointCard}</div>
      <div class="foot">${chromePills()}</div>`
          : pointCard
      }
    </div>
  </div>
</body>
</html>`;
}

/**
 * @param {{ headline: string; bullets?: string[]; layout: "hook" | "numbered_list"; eyebrow?: string; photos?: Array<{ src: string; alt?: string; widget?: string } | string>; photoSrc?: string; photoAlt?: string }} input
 */
export function slidesFor(input) {
  const bullets = (input.bullets ?? []).map((item) => item.trim()).filter(Boolean);
  const eyebrow = input.eyebrow ?? "";
  const photos = input.photos ?? [];

  const photoAt = (index) => {
    const entry = photos[index];
    if (!entry) {
      return {
        photoSrc: input.photoSrc,
        photoAlt: input.photoAlt,
        widget: undefined,
      };
    }
    if (typeof entry === "string") {
      return { photoSrc: entry, photoAlt: input.photoAlt, widget: undefined, photoPosition: undefined };
    }
    return {
      photoSrc: entry.src,
      photoAlt: entry.alt ?? input.photoAlt,
      widget: entry.widget,
      photoPosition: entry.position,
    };
  };

  if (input.layout === "hook") {
    const photo = photoAt(0);
    return [
      {
        name: "01.png",
        html: buildSlideHtml(input.headline, bullets[0] ?? "", TTK_BRAND.wordmark, {
          kind: "hook",
          eyebrow,
          widget: photo.widget ?? "tables",
          photoSrc: photo.photoSrc,
          photoAlt: photo.photoAlt,
          photoPosition: photo.photoPosition,
        }),
      },
    ];
  }
  if (input.layout === "numbered_list") {
    const coverPhoto = photoAt(0);
    const slides = [
      {
        name: "01.png",
        html: buildSlideHtml(input.headline, bullets.length ? `${bullets.length} things` : "", TTK_BRAND.wordmark, {
          kind: "cover",
          eyebrow,
          widget: coverPhoto.widget,
          photoSrc: coverPhoto.photoSrc,
          photoAlt: coverPhoto.photoAlt,
          photoPosition: coverPhoto.photoPosition,
        }),
      },
    ];
    bullets.forEach((bullet, index) => {
      const photo = photoAt(index + 1);
      slides.push({
        name: `${String(index + 2).padStart(2, "0")}.png`,
        html: buildSlideHtml(bullet, "", TTK_BRAND.wordmark, {
          kind: "point",
          number: String(index + 1).padStart(2, "0"),
          eyebrow,
          widget: photo.widget ?? "feature",
          cardTitle: bullet,
          photoSrc: photo.photoSrc,
          photoAlt: photo.photoAlt,
          photoPosition: photo.photoPosition,
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
