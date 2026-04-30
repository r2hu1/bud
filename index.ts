#!/usr/bin/env bun

import { Command } from "commander";
import { setup, reset } from "./core/cli/setup";
import { generateStream } from "./core/ai/stream";
import { normalizeCommands, parseCommands } from "./core/input";
import { select } from "@inquirer/prompts";
import boxen from "boxen";
import { runCMD } from "./core/cli/run";
import { changeModel } from "./core/cli/config";
import chalk from "chalk";
import readline from "readline";

const program = new Command();

program.name("bud").argument("[input...]");

program.command("setup").action(async () => {
  await setup();
});

program.command("model").action(async () => {
  await changeModel();
});

program.command("reset").action(async () => {
  reset();
});

program.command("help").action(async () => {
  console.log(
    boxen(
      `
  🌱 bud — AI-powered CLI assistant

  USAGE
    ${chalk.cyan("bud")} "your task"        Generate and run shell commands
    ${chalk.cyan("bud")} <command>          Run a specific command

  COMMANDS
    setup                  Configure your API key and model
    model                  Switch the active model
    reset                  Reset config to defaults
    help                   Show this help message

  EXAMPLES
    ${chalk.cyan("bud")} list all running docker containers
    ${chalk.cyan("bud")} find large files over 100mb
    ${chalk.cyan("bud")} compress all pngs in current folder
    ${chalk.cyan("bud")} kill process on port 3000
`,
      {
        padding: 0.1,
        borderStyle: "round",
        borderColor: "green",
        title: "help",
        titleAlignment: "left",
      },
    ),
  );
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
      { name: "Yes", value: 1 },
      { name: "No", value: 0 },
      { name: "Modify commands", value: 2 },
    ],
  });
  if (ok !== 1 && ok !== 2) {
    process.stdout.write("");
    return process.exit(0);
  }
  if (ok === 2) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const edited = await new Promise<string>((resolve) => {
      rl.question("", (answer) => {
        resolve(answer);
        rl.close();
      });
      rl.write(content.replace(/\n/g, " && "));
    });

    const final = edited.split(" && ").filter(Boolean);
    for (const cmd of final) {
      try {
        console.log(`\n→ ${cmd}`);
        await runCMD(cmd);
      } catch (e) {
        console.error(`✖ Failed: ${cmd}`);
        break;
      }
    }
    return;
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
