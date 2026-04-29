import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export type Provider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "groq"
  | "mistral";

export function getModel(provider: Provider, apiKey: string, model: string) {
  if (provider === "openai") {
    return createOpenAI({ apiKey })(model);
  }

  if (provider === "anthropic") {
    return createAnthropic({ apiKey })(model);
  }

  if (provider === "gemini") {
    return createGoogleGenerativeAI({ apiKey })(model);
  }

  if (provider === "mistral") {
    return createMistral({ apiKey })(model);
  }

  if (provider === "groq") {
    return createGroq({ apiKey })(model);
  }

  if (provider === "openrouter") {
    return createOpenRouter({ apiKey })(model);
  }

  throw new Error("Invalid provider");
}
