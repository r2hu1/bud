import { existsSync, readFileSync } from "fs";
import { homedir } from "os";

type Provider = "openai" | "anthropic" | "gemini";

type Config = {
  provider: Provider;
  apiKey: string;
};

const configPath = `${homedir()}/.bud/config.json`;

export function loadConfig(): Config {
  if (!existsSync(configPath)) {
    console.error("Run: bud setup");
    process.exit(1);
  }

  return JSON.parse(readFileSync(configPath, "utf-8"));
}
