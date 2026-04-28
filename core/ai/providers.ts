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
    return createOpenAI({ apiKey })("gpt-4o-mini");
  }

  if (provider === "anthropic") {
    return createAnthropic({ apiKey })("claude-3-haiku-20240307");
  }

  if (provider === "gemini") {
    return createGoogleGenerativeAI({ apiKey })("gemini-1.5-flash");
  }

  if (provider === "mistral") {
    return createMistral({ apiKey })("mistral-small-latest");
  }

  if (provider === "groq") {
    return createGroq({ apiKey })("openai/gpt-oss-20b");
  }

  if (provider === "openrouter") {
    return createOpenRouter({ apiKey })("openai/gpt-4o-mini");
  }

  throw new Error("Invalid provider");
}
