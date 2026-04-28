#!/usr/bin/env bun

import { Command } from "commander";
import { setup, reset } from "./core/cli/setup";
import { SYSTEM_PROMPT } from "./core/ai/system-prompt";
import { generateStream } from "./core/ai/stream";

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

  await generateStream(SYSTEM_PROMPT + text);
});

program.parse();
