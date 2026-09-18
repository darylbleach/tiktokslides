import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  downloadSlideshowJob,
  listLibraryAccounts,
  persistFormat,
  readAccount,
  readJob,
  renderDraftJob,
  startDiscoveryJob,
} from "../api.ts";

const server = new McpServer({
  name: "tiktokslides",
  version: "0.1.0",
});

const filtersShape = z
  .object({
    minSlideshowShare: z.number().optional(),
    minMedianViews: z.number().optional(),
    minViewsPerFollower: z.number().optional(),
    minPostsPerWeek: z.number().optional(),
    nearMissMargin: z.number().optional(),
  })
  .optional();

server.registerTool(
  "start_discovery",
  {
    description:
      "Search TikTok in the user's Chrome and measure unique accounts. Read-only: never posts, likes, follows, or comments.",
    inputSchema: {
      keywords: z.string().describe('Search terms, e.g. "wedding planning"'),
      target: z.number().int().positive().optional().describe("Accounts to measure. Default 20."),
      filters: filtersShape,
    },
  },
  async ({ keywords, target, filters }) => {
    const job = startDiscoveryJob(keywords, target ?? 20, filters);
    return jsonResult(job);
  },
);

server.registerTool(
  "get_job",
  {
    description: "Read a job's status. needs_human means a captcha or login check is waiting in Chrome.",
    inputSchema: {
      id: z.string(),
    },
  },
  async ({ id }) => jsonResult(readJob(id)),
);

server.registerTool(
  "list_library",
  {
    description: "List measured accounts. Filter by niche, verdict, or minimum median slideshow views.",
    inputSchema: {
      niche: z.string().optional(),
      verdict: z.enum(["passed", "near_miss", "failed"]).optional(),
      minViews: z.number().optional(),
    },
  },
  async ({ niche, verdict, minViews }) => jsonResult(listLibraryAccounts({ niche, verdict, minViews })),
);

server.registerTool(
  "get_account",
  {
    description: "Stored metrics and recent posts for one account.",
    inputSchema: {
      username: z.string(),
    },
  },
  async ({ username }) => {
    const account = await readAccount(username);
    if (!account) {
      return jsonResult({ error: `No stored account @${username.replace(/^@/, "")}` });
    }
    return jsonResult(account);
  },
);

server.registerTool(
  "download_slideshow",
  {
    description: "Download ordered slide images for one TikTok photo post into data/downloads.",
    inputSchema: {
      url: z.string().url(),
    },
  },
  async ({ url }) => jsonResult(await downloadSlideshowJob(url)),
);

server.registerTool(
  "name_formats",
  {
    description:
      "Persist a named format against example posts. The model names the format; this tool only stores it.",
    inputSchema: {
      name: z.string(),
      notes: z.string().optional(),
      examplePostIds: z.array(z.string()).optional(),
      exampleUrls: z.array(z.string()).optional(),
    },
  },
  async ({ name, notes, examplePostIds, exampleUrls }) =>
    jsonResult(persistFormat({ name, notes, examplePostIds, exampleUrls })),
);

server.registerTool(
  "render_draft",
  {
    description: "Render a 1080x1920 PNG draft folder. Layouts: hook or numbered_list.",
    inputSchema: {
      headline: z.string(),
      bullets: z.array(z.string()).optional(),
      layout: z.enum(["hook", "numbered_list"]),
    },
  },
  async ({ headline, bullets, layout }) => jsonResult(await renderDraftJob({ headline, bullets, layout })),
);

function jsonResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

const transport = new StdioServerTransport();
await server.connect(transport);
