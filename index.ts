#!/usr/bin/env bun

import { Command } from "commander";
import { setup, reset } from "./core/cli/setup";
import { SYSTEM_PROMPT } from "./core/ai/system-prompt";
import { generateStream } from "./core/ai/stream";
import { normalizeCommands, parseCommands } from "./core/input";
import { confirm } from "@inquirer/prompts";
import boxen from "boxen";
import { $ } from "bun";
import { runCMD } from "./core/cli/run";

const program = new Command();

program.name("bud").argument("[input...]");

program.command("setup").action(async () => {
  await setup();
});

program.command("reset").action(async () => {
  reset();
});

program.action(async (input: string[]) => {
  const text = input.join(" ").trim();

  if (!text) {
    console.log('Usage: bud "your task"');
    return;
  }

  const res = await generateStream(SYSTEM_PROMPT + text);
  const parsed = parseCommands(res ?? "");
  const normalized = normalizeCommands(parsed);

  const content = normalized.join("\n");
  console.log(
    boxen(content, {
      padding: 1,
      borderStyle: "round",
      borderColor: "cyan",
    }),
  );
  const ok = await confirm({ message: "Execute these commands?" });
  if (!ok) {
    process.stdout.write("");
    return process.exit(0);
  }
  for (const cmd of normalized) {
    try {
      console.log(`\n→ ${cmd}`);
      await runCMD(cmd);
    } catch (e) {
      console.error(`✖ Failed: ${cmd}`);
      break;
    }
  }
});

program.parse();
