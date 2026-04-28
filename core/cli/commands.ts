#!/usr/bin/env bun

import { Command } from "commander";
import { reset, setup } from "./setup";
import { generateStream } from "../ai/stream";

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
  if (!text) return;
  await generateStream(text);
});

program.parse();
