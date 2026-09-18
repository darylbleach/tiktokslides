# tiktokslides

Local TikTok slideshow research for [Tie The Knot](https://tietheknot.uk). Runs in your Chrome, stores a library on disk, and talks to Cursor over MCP. It never posts, likes, follows, or comments.

Repo: [`~/Projects/tiktokslides`](/Users/darylbleach/Projects/tiktokslides)  
Remote: https://github.com/darylbleach/tiktokslides.git

## Setup

```bash
cd ~/Projects/tiktokslides
pnpm install
chmod +x scripts/open-chrome.sh
pnpm chrome
```

Log into TikTok in the window that opens. Leave it visible.

Then either:

```bash
pnpm discover "wedding planning" --target 20
```

or add the MCP server from [`.cursor/mcp.json`](.cursor/mcp.json) in Cursor Settings → MCP.

Other useful first-niche keywords: `wedding guest list`, `seating chart`, `save the date`.

## What it does

1. Search TikTok the way you would, from your logged-in Chrome.
2. Measure accounts: slideshow share, median views, views per follower, cadence.
3. Verdicts: passed / near miss (with margin) / failed. Defaults are tuned for wedding slideshows: ≥50% slideshow share, ≥1,000 median slideshow views, ≥0.2 views/follower, ≥0.3 posts/week.
4. Download slideshow slides, and render simple 1080×1920 PNG drafts.

## MCP tools

- `start_discovery` — `{ keywords, target }`
- `get_job` — `{ id }`
- `list_library` — filter by niche, verdict, min views
- `get_account` — `{ username }`
- `download_slideshow` — `{ url }`
- `name_formats` — persist named formats against example posts
- `render_draft` — `{ headline, bullets, layout }`

If TikTok shows a check, the job pauses (`needs_human`). Clear it in Chrome; the job resumes.

When TikTok changes markup or JSON, patch `src/tiktok/` and rerun.

## CLI

```bash
pnpm discover "wedding planning" --target 20
pnpm job <id>
pnpm library --niche wedding --verdict passed --min-views 1000
pnpm account plannerjane
pnpm download https://www.tiktok.com/@user/photo/123
pnpm formats --name "Numbered guest-list hook" --posts 123,456
pnpm render --headline "Your seating chart is lying" --bullets "Start with VIPs,Kids table last" --layout numbered_list
```

## Tests

```bash
pnpm test
```
