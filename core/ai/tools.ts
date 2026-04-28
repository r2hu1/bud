import { tool } from "ai";
import { z } from "zod";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  renameSync,
} from "fs";
import { cwd, env } from "process";
import path from "path";
import { execSync } from "child_process";
import os from "os";

export const tools = {
  cwd: tool({
    description: "Get current working directory",
    inputSchema: z.object({}),
    execute: async () => cwd(),
  }),

  env: tool({
    description: "Get environment variables",
    inputSchema: z.object({}),
    execute: async () => Object.keys(env),
  }),

  os: tool({
    description: "Get OS information",
    inputSchema: z.object({}),
    execute: async () => ({
      platform: os.platform(),
      arch: os.arch(),
    }),
  }),

  listFiles: tool({
    description: "List files in directory",
    inputSchema: z.object({
      path: z.string().optional(),
    }),
    execute: async ({ path: p }) => {
      return readdirSync(p || cwd());
    },
  }),

  readFile: tool({
    description: "Read file content",
    inputSchema: z.object({
      path: z.string(),
    }),
    execute: async ({ path: p }) => {
      return readFileSync(p, "utf-8").slice(0, 3000);
    },
  }),

  runCommand: tool({
    description: "Execute shell command",
    inputSchema: z.object({
      command: z.string(),
    }),
    execute: async ({ command }) => {
      if (
        command.includes("rm -rf /") ||
        command.includes("shutdown") ||
        command.includes("reboot")
      ) {
        return "blocked";
      }

      try {
        return execSync(command, { encoding: "utf-8" });
      } catch (e: any) {
        return e.message;
      }
    },
  }),

  gitStatus: tool({
    description: "Get git status",
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
    description: "Search text in files",
    inputSchema: z.object({
      query: z.string(),
    }),
    execute: async ({ query }) => {
      try {
        return execSync(`grep -r "${query}" .`, { encoding: "utf-8" });
      } catch {
        return "";
      }
    },
  }),
};
