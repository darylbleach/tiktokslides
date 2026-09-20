import { mkdirSync, writeFileSync, existsSync, statSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const UNSPLASH_DIR = path.join(root, "data", "unsplash");

/** Line-matched Unsplash stills for the TTK TikTok drafts. Do not commit binaries. */
export const UNSPLASH_PHOTOS = {
  invitations_envelopes: {
    id: "photo-1632610992723-82d7c212f6d7",
    photographer: "Fiona Murray-deGraaff",
    username: "fionamurrayphoto",
    page: "https://unsplash.com/photos/a-wedding-stationery-with-a-black-and-white-envelope-a0BlHWem6l0",
    alt: "Wedding invitation suite with a black and white envelope",
    topic: "invitation / guest-list cover",
  },
  mums_colleague_party: {
    id: "photo-1768508951126-f90917cc510e",
    photographer: "Filip Rankovic Grobgaard",
    username: "filipgrobgaard",
    page: "https://unsplash.com/photos/man-in-a-patterned-tuxedo-talks-to-a-woman-kl6jG4VQGKk",
    alt: "Older man in a patterned tuxedo and bow tie talking over champagne at a cocktail party",
    topic: "awkward older colleague at a party",
    position: "center 22%",
  },
  plus_one_couple_walking: {
    id: "photo-1549990414-deeea9e3c0b6",
    photographer: "Simon Boxus",
    username: "simonlerouge",
    page: "https://unsplash.com/photos/couple-holding-hands-while-walking-Azd25HQo_Ks",
    alt: "Two people holding hands and walking into a gathering together",
    topic: "plus one / couple arriving",
    position: "center 40%",
  },
  distant_relatives_table: {
    id: "photo-1416453072034-c8dbfa2856b5",
    photographer: "Kevin Curtis",
    username: "kcurtis113",
    page: "https://unsplash.com/photos/people-sitting-beside-brown-wooden-table-inside-room-QlnUpMED6Qs",
    alt: "Mixed-age relatives and friends around a long table talking over drinks",
    topic: "family reunion / distant relatives",
    position: "center 42%",
  },
  office_party_work_people: {
    id: "photo-1758520144658-c87be518b87e",
    photographer: "Vitaly Gariev",
    username: "silverkblack",
    page: "https://unsplash.com/photos/people-in-party-hats-dancing-in-an-office-at-work-celebration-Mgja3hOHoL8",
    alt: "Office workers in suits dancing at a workplace party in party hats",
    topic: "work colleagues / corporate people at an event",
    position: "center 28%",
  },
  phone_and_checklist: {
    id: "photo-1763729625610-f356196f587a",
    photographer: "Jakub \u017berdzicki",
    username: "jakubzerdzicki",
    page: "https://unsplash.com/photos/hands-writing-in-notebook-near-laptop-and-phone-C9HUHreoPc0",
    alt: "Hands editing a list in a notebook beside a phone on the desk",
    topic: "phone / list / checklist being edited",
    position: "center 45%",
  },
  reception_table: {
    id: "photo-1769812343775-85a27e6a076c",
    photographer: "Jonathan Borba",
    username: "jonathanborba",
    page: "https://unsplash.com/photos/elegant-wedding-reception-table-with-floral-centerpiece-and-chairs-QvprbCoOkLY",
    alt: "Wedding reception table with floral centrepiece, chairs and place settings",
    topic: "laid table / seating",
    position: "center 70%",
  },
  calendar_not_circled: {
    id: "photo-1506784983877-45594efa4cbe",
    photographer: "Est\u00e9e Janssens",
    username: "esteejanssens",
    page: "https://unsplash.com/photos/white-ceramic-mug-with-coffee-on-top-of-a-planner-aQfhbxailCs",
    alt: "Open monthly planner calendar with a coffee mug and no wedding date circled",
    topic: "unsent / dates not locked yet",
    position: "center 40%",
  },
  handwritten_names_list: {
    id: "photo-1484480974693-6ca0a78fb36b",
    photographer: "Glenn Carstens-Peters",
    username: "glenncarstenspeters",
    page: "https://unsplash.com/photos/person-writing-bucket-list-on-book-RLw-UC03Gwc",
    alt: "Hand writing a messy checklist of names and tasks in a notebook",
    topic: "changing names / messy list",
    position: "center 35%",
  },
  must_invite_checklist: {
    id: "photo-1753715613651-749ef230482c",
    photographer: "Jakub \u017berdzicki",
    username: "jakubzerdzicki",
    page: "https://unsplash.com/photos/checking-items-off-a-list-on-a-notepad-VKnmszzzTig",
    alt: "Hand reviewing a handwritten must-invite checklist in a notebook",
    topic: "write the list before stationery",
    position: "center 55%",
  },
  plus_one_extra_guest: {
    id: "photo-1533777419517-3e4017e2e15a",
    photographer: "Pablo Merch\u00e1n Montes",
    username: "pablomerchanm",
    page: "https://unsplash.com/photos/three-people-having-a-toast-on-table-wYOPqmtDD0w",
    alt: "Three people toasting at a table, the extra guest in the plus-one seat",
    topic: "plus one / extra guest at the table",
    position: "center 35%",
  },
  posting_the_card: {
    id: "photo-1633509838287-8382a2786343",
    photographer: "Phil Hearing",
    username: "philhearing",
    page: "https://unsplash.com/photos/a-red-post-box-with-the-word-post-office-written-on-it-hv6RozML3WQ",
    alt: "Red Post Office box ready for posting save-the-date cards",
    topic: "sending / posting the card",
    position: "center 48%",
  },
  place_setting: {
    id: "photo-1522413452208-996ff3f3e740",
    photographer: "Jordan Arnold",
    username: "jordanarnold",
    page: "https://unsplash.com/photos/white-ceramic-dinner-plate-set-on-brown-wooden-table-Ul07QK2AR-0",
    alt: "Wedding place setting with white plates, greenery and candles",
    topic: "place setting",
  },
};

export const TTK_SLIDE_PHOTOS = {
  "guest-list-dont-invite": [
    "invitations_envelopes",
    "mums_colleague_party",
    "plus_one_couple_walking",
    "distant_relatives_table",
    "office_party_work_people",
    "phone_and_checklist",
  ],
  "seating-chart-after-rsvp": ["reception_table"],
  "save-the-date-after-list": [
    "calendar_not_circled",
    "handwritten_names_list",
    "must_invite_checklist",
    "plus_one_extra_guest",
    "posting_the_card",
  ],
};

const FALLBACKS = {
  mums_colleague_party: "office_party_work_people",
  plus_one_couple_walking: "plus_one_extra_guest",
  distant_relatives_table: "plus_one_extra_guest",
  office_party_work_people: "mums_colleague_party",
  phone_and_checklist: "must_invite_checklist",
  calendar_not_circled: "handwritten_names_list",
  handwritten_names_list: "must_invite_checklist",
  must_invite_checklist: "handwritten_names_list",
  plus_one_extra_guest: "plus_one_couple_walking",
  posting_the_card: "invitations_envelopes",
  reception_table: "place_setting",
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
