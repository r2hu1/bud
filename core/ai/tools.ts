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

function resolvePath(p?: string) {
  if (!p) return cwd();
  if (p.startsWith("~")) return path.join(process.env.HOME || "", p.slice(1));
  return path.resolve(p);
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
};
