import { mkdirSync, writeFileSync, existsSync, statSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const UNSPLASH_DIR = path.join(root, "data", "unsplash");

/** Topic-matched Unsplash stills for the TTK TikTok drafts. Do not commit binaries. */
export const UNSPLASH_PHOTOS = {
  invitations_envelopes: {
    id: "photo-1632610992723-82d7c212f6d7",
    photographer: "Fiona Murray-deGraaff",
    username: "fionamurrayphoto",
    page: "https://unsplash.com/photos/a-wedding-stationery-with-a-black-and-white-envelope-a0BlHWem6l0",
    alt: "Wedding invitation suite with a black and white envelope",
    topic: "invitations",
  },
  invitations_table: {
    id: "photo-1721176487015-5408ae0e9bc2",
    photographer: "Stacey Vandas",
    username: "staceyvandas",
    page: "https://unsplash.com/photos/a-table-topped-with-lots-of-different-items-8HX_r68ZM58",
    alt: "Wedding stationery and invitation pieces laid out on a table",
    topic: "invitations",
  },
  guest_names_card: {
    id: "photo-1738898179451-b5fc497f9f8e",
    photographer: "Micah & Sammie Chaffin",
    username: "micahandsammiechaffin",
    page: "https://unsplash.com/photos/a-close-up-of-a-wedding-stationery-on-a-table-AuZp_2LGSCs",
    alt: "Close-up of a wedding invitation with guest names on the card",
    topic: "guest names",
    position: "78% 40%",
  },
  wedding_guests_toast: {
    id: "photo-1761499101934-4c79d09b14e9",
    photographer: "Rodrigo Rodrigues",
    username: "wolfart32",
    page: "https://unsplash.com/photos/newlyweds-celebrated-with-guests-toasting-champagne-9xcKHqQNoco",
    alt: "Newlyweds with wedding guests toasting champagne",
    topic: "wedding guests",
  },
  dinner_guests: {
    id: "photo-1756267237113-8e51341a21ff",
    photographer: "Fotógrafo Samuel Cruz",
    username: "fotografosamuelcruz",
    page: "https://unsplash.com/photos/wedding-reception-with-guests-seated-outdoors-at-night-rl4OLJsZqds",
    alt: "Wedding reception guests seated at dinner tables",
    topic: "dinner guests",
  },
  invitations_suite_names: {
    id: "photo-1732649124686-3bab54f79aa3",
    photographer: "Micah & Sammie Chaffin",
    username: "micahandsammiechaffin",
    page: "https://unsplash.com/photos/a-close-up-of-a-wedding-suite-on-a-bed-BiT7NBELhTg",
    alt: "Wedding invitation suite showing couple names on the card",
    topic: "invitations",
    position: "80% 45%",
  },
  reception_table: {
    id: "photo-1769812343775-85a27e6a076c",
    photographer: "Jonathan Borba",
    username: "jonathanborba",
    page: "https://unsplash.com/photos/elegant-wedding-reception-table-with-floral-centerpiece-and-chairs-QvprbCoOkLY",
    alt: "Wedding reception table with floral centrepiece, chairs and place settings",
    topic: "table",
    position: "center 70%",
  },
  place_setting: {
    id: "photo-1522413452208-996ff3f3e740",
    photographer: "Jordan Arnold",
    username: "jordanarnold",
    page: "https://unsplash.com/photos/white-ceramic-dinner-plate-set-on-brown-wooden-table-Ul07QK2AR-0",
    alt: "Wedding place setting with white plates, greenery and candles",
    topic: "place setting",
  },
  long_dining_table: {
    id: "photo-1770217613852-4da88e94c7a9",
    photographer: "Alexander Mass",
    username: "alexandermassph",
    page: "https://unsplash.com/photos/elegant-long-dining-table-set-for-a-formal-event-Xp1LASiVhi8",
    alt: "Long dining table set with place settings, glassware and flowers",
    topic: "table numbers",
  },
  invitation_card: {
    id: "photo-1509316554658-04f9287cdb78",
    photographer: "micheile henderson",
    username: "micheile",
    page: "https://unsplash.com/photos/wedding-invatation-card-b-OFeL7Yr08",
    alt: "Wedding invitation card on a styled background",
    topic: "stationery",
  },
  calendar_dates: {
    id: "photo-1717435860330-f9fc106809c3",
    photographer: "Shoham Avisrur",
    username: "shoham_avisrur",
    page: "https://unsplash.com/photos/a-close-up-of-a-paper-with-numbers-on-it-0AO1S25tSwM",
    alt: "Save-the-date cards showing the wedding date 04.06.2024",
    topic: "calendar",
  },
  stationery_ribbon: {
    id: "photo-1633037773384-27d7ac0491e7",
    photographer: "Pau Patterson Photography",
    username: "paupattersonphotography_",
    page: "https://unsplash.com/photos/a-wedding-suite-with-flowers-and-a-ribbon-lxHHTpPfA4w",
    alt: "Wedding stationery suite with flowers and a ribbon",
    topic: "stationery",
  },
  save_the_date_card: {
    id: "photo-1712313992209-93a2cc377ede",
    photographer: "ISKRA Photography",
    username: "iskra_photography",
    page: "https://unsplash.com/photos/a-green-and-white-card-with-a-bow-on-it-8khFeILFzZU",
    alt: "Green and white save-the-date card with a bow",
    topic: "save-the-date card",
  },
  invitations_greenery: {
    id: "photo-1742581659446-6260fc707e7d",
    photographer: "Micah & Sammie Chaffin",
    username: "micahandsammiechaffin",
    page: "https://unsplash.com/photos/wedding-invitations-and-stationery-displayed-with-greenery-5ZribvTyQVQ",
    alt: "Wedding invitations and stationery displayed with greenery",
    topic: "save-the-date card",
  },
  couple_editorial: {
    id: "photo-1519741497674-611481863552",
    photographer: "Nathan Dumlao",
    username: "nate_dumlao",
    page: "https://unsplash.com/photos/man-and-woman-kissing-holding-wedding-bouquet-1q7MmXKJyYc",
    alt: "Couple in wedding clothes with a bouquet at golden hour",
    topic: "date/couple editorial",
  },
  couple_hands: {
    id: "photo-1520854221256-17451cc403bf",
    photographer: "Nathan Dumlao",
    username: "nate_dumlao",
    page: "https://unsplash.com/photos/man-and-woman-holding-hands-focus-photo-464ps_nOflw",
    alt: "Couple holding hands in an editorial wedding portrait",
    topic: "date/couple editorial",
  },
};

export const TTK_SLIDE_PHOTOS = {
  "guest-list-dont-invite": [
    "invitations_envelopes",
    "invitations_table",
    "guest_names_card",
    "wedding_guests_toast",
    "dinner_guests",
    "invitations_suite_names",
  ],
  "seating-chart-after-rsvp": ["reception_table"],
  "save-the-date-after-list": [
    "invitation_card",
    "calendar_dates",
    "stationery_ribbon",
    "save_the_date_card",
    "couple_editorial",
  ],
};

const FALLBACKS = {
  calendar_dates: "save_the_date_card",
  dinner_guests: "wedding_guests_toast",
  reception_table: "place_setting",
  save_the_date_card: "invitations_greenery",
  couple_editorial: "couple_hands",
  guest_names_card: "invitations_suite_names",
};

export function photoPath(key) {
  const photo = UNSPLASH_PHOTOS[key];
  if (!photo) throw new Error(`Unknown Unsplash photo key: ${key}`);
  return path.join(UNSPLASH_DIR, `${photo.id}.jpg`);
}

export function photoDataUri(filePath) {
  const buffer = readFileSync(filePath);
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

export function creditFor(key) {
  const photo = UNSPLASH_PHOTOS[key];
  if (!photo) throw new Error(`Unknown Unsplash photo key: ${key}`);
  return {
    key,
    id: photo.id,
    photographer: photo.photographer,
    username: photo.username,
    page: photo.page,
    alt: photo.alt,
    topic: photo.topic,
    credit: `Photo by ${photo.photographer} (@${photo.username}) on Unsplash`,
  };
}

async function downloadOne(photo, dest) {
  mkdirSync(path.dirname(dest), { recursive: true });
  const urls = [
    `https://images.unsplash.com/${photo.id}?w=1600&h=2000&fit=crop&crop=entropy&auto=format&q=82`,
    `https://images.unsplash.com/${photo.id}?fm=jpg&q=80&w=1600&auto=format&fit=crop`,
  ];
  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "tiktokslides/0.1 (Tie The Knot drafts; unsplash attribution in data/drafts/credits.json)",
          Accept: "image/jpeg,image/*,*/*",
        },
        redirect: "follow",
      });
      if (!response.ok) {
        lastError = new Error(`${response.status} ${url}`);
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength < 8_000) {
        lastError = new Error(`tiny body ${buffer.byteLength} from ${url}`);
        continue;
      }
      writeFileSync(dest, buffer);
      return dest;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error(`Failed to download ${photo.id}`);
}

export async function ensurePhoto(key) {
  const photo = UNSPLASH_PHOTOS[key];
  if (!photo) throw new Error(`Unknown Unsplash photo key: ${key}`);
  const dest = photoPath(key);
  if (existsSync(dest) && statSync(dest).size > 8_000) {
    return dest;
  }
  try {
    return await downloadOne(photo, dest);
  } catch (error) {
    const fallbackKey = FALLBACKS[key];
    if (fallbackKey && fallbackKey !== key) {
      return ensurePhoto(fallbackKey);
    }
    throw error;
  }
}

export async function ensureKeys(keys) {
  const unique = [...new Set(keys)];
  const files = {};
  for (const key of unique) {
    files[key] = await ensurePhoto(key);
  }
  return files;
}
