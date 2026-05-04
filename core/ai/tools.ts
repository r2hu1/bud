import { tool } from "ai";
import { z } from "zod";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
  mkdirSync,
} from "fs";
import { cwd, env } from "process";
import path from "path";
import { execSync } from "child_process";
import os from "os";
import * as cheerio from "cheerio";

function resolvePath(p?: string) {
  if (!p) return cwd();
  if (p.startsWith("~")) return path.join(process.env.HOME || "", p.slice(1));
  return path.resolve(p);
}

async function fetchAndParse(
  url: string,
  maxChars: number,
): Promise<
  | {
      url: string;
      title?: string;
      content: string;
      contentType: string;
      totalLength: number;
    }
  | { url: string; error: string }
> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AI-Agent/1.0)",
      Accept: "text/html,application/xhtml+xml,*/*",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    return { url, error: `HTTP ${response.status}: ${response.statusText}` };
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = await response.text();
    return {
      url,
      content: json.slice(0, maxChars),
      contentType,
      totalLength: json.length,
    };
  }

  if (
    contentType.includes("text/plain") ||
    contentType.includes("text/markdown")
  ) {
    const text = await response.text();
    return {
      url,
      content: text.slice(0, maxChars),
      contentType,
      totalLength: text.length,
    };
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $(
    "script, style, nav, footer, header, aside, iframe, noscript, [aria-hidden='true'], .cookie-banner, #cookie-banner",
  ).remove();

  const title = $("title").text().trim() || $("h1").first().text().trim();
  const mainSelectors = [
    "main",
    "article",
    '[role="main"]',
    ".content",
    "#content",
    ".post",
    ".article-body",
  ];
  let bodyText = "";
  for (const sel of mainSelectors) {
    const el = $(sel);
    if (el.length) {
      bodyText = el.text();
      break;
    }
  }
  if (!bodyText) bodyText = $("body").text();

  const clean = bodyText
    .replace(/\t/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // console.log({
  //   url,
  //   title,
  //   content: clean.slice(0, maxChars),
  //   contentType,
  //   totalLength: clean.length,
  // });
  return {
    url,
    title,
    content: clean.slice(0, maxChars),
    contentType,
    totalLength: clean.length,
  };
}

async function searchDuckDuckGo(
  query: string,
  maxResults: number,
): Promise<{ title: string; url: string; snippet: string }[]> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AI-Agent/1.0)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error(`Search failed: ${response.status}`);

  const html = await response.text();
  const $ = cheerio.load(html);
  const results: { title: string; url: string; snippet: string }[] = [];

  $(".result").each((_, el) => {
    if (results.length >= maxResults) return false;
    const titleEl = $(el).find(".result__title a");
    const snippetEl = $(el).find(".result__snippet");
    const rawHref = titleEl.attr("href") ?? "";

    let url = rawHref;
    try {
      const parsed = new URL("https://duckduckgo.com" + rawHref);
      url =
        parsed.searchParams.get("uddg") ||
        parsed.searchParams.get("u") ||
        rawHref;
    } catch {}

    const title = titleEl.text().trim();
    const snippet = snippetEl.text().trim();

    if (title && url && url.startsWith("http")) {
      results.push({ title, url, snippet });
    }
  });

  return results;
}

export const tools = {
  cwd: tool({
    description: "Get current working directory",
    inputSchema: z.object({}),
    execute: async () => cwd(),
  }),

  os: tool({
    description: "Get OS platform and architecture",
    inputSchema: z.object({}),
    execute: async () => ({
      platform: os.platform(),
      arch: os.arch(),
    }),
  }),

  env: tool({
    description: "List environment variable names",
    inputSchema: z.object({}),
    execute: async () => Object.keys(env),
  }),

  listFiles: tool({
    description: "List files in a directory with metadata",
    inputSchema: z.object({
      path: z.string().optional(),
    }),
    execute: async ({ path: p }) => {
      const dir = resolvePath(p);

      return readdirSync(dir).map((name) => {
        const full = path.join(dir, name);
        const stat = statSync(full);

        return {
          name,
          path: full,
          type: stat.isDirectory() ? "dir" : "file",
          ext: path.extname(name),
          size: stat.size,
        };
      });
    },
  }),

  readFile: tool({
    description: "Read file content (first 3000 chars)",
    inputSchema: z.object({
      path: z.string(),
    }),
    execute: async ({ path: p }) => {
      const full = resolvePath(p);
      return readFileSync(full, "utf-8").slice(0, 3000);
    },
  }),

  fileExists: tool({
    description: "Check if a file or directory exists",
    inputSchema: z.object({
      path: z.string(),
    }),
    execute: async ({ path: p }) => {
      return existsSync(resolvePath(p));
    },
  }),

  readFileLines: tool({
    description: "Read specific lines from a file",
    inputSchema: z.object({
      path: z.string(),
      start: z.number().min(1).optional(),
      end: z.number().min(1).optional(),
    }),
    execute: async ({ path: p, start = 1, end }) => {
      try {
        const full = resolvePath(p);
        const content = readFileSync(full, "utf-8");

        const lines = content.split("\n");

        const s = Math.max(start - 1, 0);
        const e = end ? Math.min(end, lines.length) : s + 50;

        return lines.slice(s, e).join("\n");
      } catch {
        return "";
      }
    },
  }),

  gitStatus: tool({
    description: "Get git status (short)",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        return execSync("git status --short", { encoding: "utf-8" });
      } catch {
        return "";
      }
    },
  }),

  gitDiff: tool({
    description: "Get git diff",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        return execSync("git diff", { encoding: "utf-8" });
      } catch {
        return "";
      }
    },
  }),

  searchFiles: tool({
    description: "Search for text in files",
    inputSchema: z.object({
      query: z.string(),
      path: z.string().optional(),
    }),
    execute: async ({ query, path: p }) => {
      try {
        const dir = resolvePath(p);
        return execSync(`grep -r "${query}" "${dir}"`, {
          encoding: "utf-8",
        }).slice(0, 3000);
      } catch {
        return "";
      }
    },
  }),
  webSearch: tool({
    description:
      "Search the web for a query (e.g. 'how to install react', 'what is the useEffect hook') and return titles, URLs, snippets, and optionally the full text of the top results. Use this whenever the user asks something that requires live web knowledge.",
    inputSchema: z.object({
      query: z.string().describe("Natural language search query"),
      maxResults: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .describe("Number of search results to return (default 5)"),
      fetchContent: z
        .boolean()
        .optional()
        .describe(
          "Whether to also fetch and parse the full page text for each result (default true)",
        ),
      maxCharsPerPage: z
        .number()
        .min(500)
        .max(15000)
        .optional()
        .describe(
          "Max characters to extract per page when fetchContent is true (default 4000)",
        ),
    }),
    execute: async ({
      query,
      maxResults = 5,
      fetchContent = true,
      maxCharsPerPage = 4000,
    }) => {
      let results: { title: string; url: string; snippet: string }[];
      try {
        results = await searchDuckDuckGo(query, maxResults);
      } catch (err) {
        return {
          error: `Search engine error: ${err instanceof Error ? err.message : String(err)}`,
        };
      }

      if (!fetchContent) return { query, results };

      const chunks: (typeof results)[] = [];
      for (let i = 0; i < results.length; i += 3)
        chunks.push(results.slice(i, i + 3));

      const enriched = [];
      for (const chunk of chunks) {
        const fetched = await Promise.all(
          chunk.map(async (r) => {
            try {
              const page = await fetchAndParse(r.url, maxCharsPerPage);
              return { ...r, ...page };
            } catch (err) {
              return {
                ...r,
                error: err instanceof Error ? err.message : String(err),
              };
            }
          }),
        );
        enriched.push(...fetched);
      }
      // console.log(query, enriched.length, enriched);
      return { query, totalResults: enriched.length, results: enriched };
    },
  }),

  fetchWebPage: tool({
    description:
      "Fetch and parse a specific URL, returning clean readable text stripped of HTML, scripts, and nav/footer noise. Use when you already have a URL and want its content.",
    inputSchema: z.object({
      url: z.string().url(),
      maxChars: z
        .number()
        .min(100)
        .max(20000)
        .optional()
        .describe("Max characters to return (default 5000)"),
    }),
    execute: async ({ url, maxChars = 5000 }) => {
      try {
        return await fetchAndParse(url, maxChars);
      } catch (err) {
        return { url, error: err instanceof Error ? err.message : String(err) };
      }
    },
  }),
};
