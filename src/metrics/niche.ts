export type NicheInput = {
  username: string;
  nickname?: string;
  signature?: string;
  hashtags?: string[];
  captions?: string[];
  keywords?: string;
};

export type NicheMatch = {
  relevant: boolean;
  score: number;
  hits: string[];
  farm: boolean;
};

const NICHE_TERMS = [
  "wedding",
  "weddings",
  "weddingplanning",
  "weddingplanner",
  "weddingtok",
  "wedtok",
  "wedli",
  "bride",
  "brides",
  "bridal",
  "bridetobe",
  "bridetok",
  "groom",
  "grooms",
  "groomsman",
  "groomstman",
  "bridesmaid",
  "bridesmaids",
  "engaged",
  "engagement",
  "newlywed",
  "newlyweds",
  "vows",
  "vow",
  "aisle",
  "veil",
  "tuxedo",
  "venue",
  "seating",
  "guestlist",
  "seatingchart",
  "savethedate",
  "henparty",
  "hendo",
  "bachelorette",
  "bridalshower",
  "reception",
  "ceremony",
  "centrepiece",
  "centerpiece",
];

const NICHE_PHRASES = [
  "guest list",
  "save the date",
  "seating chart",
  "table plan",
  "hen do",
  "hen party",
  "just married",
  "type a bride",
  "diy bride",
  "bridal suite",
  "wedding planning",
];

const GENERIC_KEYWORD_TOKENS = new Set([
  "planning",
  "tips",
  "ideas",
  "daily",
  "chart",
  "list",
  "the",
  "and",
  "for",
  "your",
  "with",
  "from",
  "life",
  "mom",
  "fitness",
  "spam",
]);

const TERM_SET = new Set(NICHE_TERMS);

export function matchNiche(input: NicheInput): NicheMatch {
  const extra = extraTermsFromKeywords(input.keywords ?? "");
  const terms = new Set([...NICHE_TERMS, ...extra.terms]);
  const phrases = [...NICHE_PHRASES, ...extra.phrases];

  const username = normalize(input.username);
  const nickname = normalize(input.nickname ?? "");
  const signature = normalize(input.signature ?? "");
  const identityText = `${username} ${nickname} ${signature}`;
  const hashtags = (input.hashtags ?? []).map((tag) => normalize(tag.replace(/^#/, "")));
  const captions = input.captions ?? [];
  const captionBodies = captions.map((caption) => normalize(stripHashtags(caption)));
  const captionTags = captions.flatMap((caption) =>
    (caption.match(/#([\p{L}\p{N}_]+)/gu) ?? []).map((tag) => normalize(tag.slice(1))),
  );

  const identityHits = hitsIn(identityText, terms, phrases);
  const bodyHits = hitsIn(captionBodies.join(" "), terms, phrases);
  const tagHits = hitsIn([...hashtags, ...captionTags].join(" "), terms, phrases);
  const hits = unique([...identityHits, ...bodyHits, ...tagHits]);
  const farm = isHashtagFarm(username, identityHits.length);
  const relevant = !farm && hits.length > 0;

  return { relevant, score: hits.length, hits, farm };
}

export function extraTermsFromKeywords(keywords: string): { terms: string[]; phrases: string[] } {
  const phrases: string[] = [];
  const terms: string[] = [];
  for (const raw of keywords.split(",")) {
    const phrase = normalize(raw);
    if (!phrase) {
      continue;
    }
    if (phrase.includes(" ")) {
      phrases.push(phrase);
    }
    for (const token of phrase.split(/\s+/)) {
      if (TERM_SET.has(token) && !GENERIC_KEYWORD_TOKENS.has(token)) {
        terms.push(token);
      }
    }
  }
  return { terms: unique(terms), phrases: unique(phrases) };
}

function hitsIn(text: string, terms: Set<string>, phrases: string[]): string[] {
  if (!text.trim()) {
    return [];
  }
  const found: string[] = [];
  for (const phrase of phrases) {
    if (text.includes(phrase)) {
      found.push(phrase);
    }
  }
  for (const token of tokenize(text)) {
    if (terms.has(token)) {
      found.push(token);
    }
  }
  return unique(found);
}

function isHashtagFarm(username: string, identityHits: number): boolean {
  if (identityHits > 0) {
    return false;
  }
  const compact = username.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return /[a-z]{5,}\d{2,}/i.test(compact);
}

function stripHashtags(value: string): string {
  return value.replace(/#([\p{L}\p{N}_]+)/gu, " ");
}

function tokenize(text: string): string[] {
  return text.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_./-]+/g, " ").replace(/\s+/g, " ").trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
