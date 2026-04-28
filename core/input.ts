export function getInput() {
  const args = Bun.argv.slice(2);
  const input = args.join(" ").trim();

  if (!input) {
    console.error("No input provided, exiting.");
    process.exit(1);
  }

  return input;
}

export function parseCommands(output: string): string[] {
  if (!output) return [];

  const match = output.match(/\[[\s\S]*\]/);

  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) {
        return parsed.filter((c) => typeof c === "string");
      }
    } catch {}
  }

  return [];
}

export function normalizeCommands(cmds: string[]) {
  if (!Array.isArray(cmds)) return [];

  return cmds.map((cmd) => cmd.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, ""));
}
