export function getInput() {
  const args = Bun.argv.slice(2);
  const input = args.join(" ").trim();

  if (!input) {
    console.error("No input provided, exiting.");
    process.exit(1);
  }

  return input;
}
