#!/usr/bin/env bun

import { Command } from "commander";
import { setup, reset } from "./core/cli/setup";
import { generateStream } from "./core/ai/stream";
import { normalizeCommands, parseCommands } from "./core/input";
import { confirm, select } from "@inquirer/prompts";
import boxen from "boxen";
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

  const res = await generateStream(text);
  const parsed = parseCommands(res ?? "");
  const normalized = normalizeCommands(parsed);
  const content = normalized.join("\n");
  if (!content) {
    return console.log(
      boxen("\nNo commands generated.\nTry being more specific.", {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
      }),
    );
  }

  console.log(
    boxen(content, {
      padding: 1,
      borderStyle: "round",
      borderColor: "cyan",
    }),
  );
  const ok = await select({
    message: "Execute these commands?",
    choices: [
      { name: "Yes", value: true },
      { name: "No", value: false },
    ],
  });
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
