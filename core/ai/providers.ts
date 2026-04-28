import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

type Provider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "groq"
  | "mistral";

export function getModel(provider: Provider, apiKey: string) {
  if (provider === "openai") {
    return createOpenAI({ apiKey })("gpt-4o");
  }

  if (provider === "anthropic") {
    return createAnthropic({ apiKey })("claude-haiku-4-5");
  }

  if (provider === "gemini") {
    return createGoogleGenerativeAI({ apiKey })("gemini-2.5-flash");
  }

  if (provider === "mistral") {
    return createMistral({ apiKey })("ministral-3b-latest");
  }

  if (provider === "groq") {
    return createGroq({ apiKey })("openai/gpt-oss-20b");
  }

  if (provider === "openrouter") {
    return createOpenRouter({ apiKey })(
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    );
  }

  throw new Error("Invalid provider");
}
