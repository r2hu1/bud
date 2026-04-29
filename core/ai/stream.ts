import { loadConfig } from "../cli/config";
import { getModel } from "./providers";
import { runLLM } from "./run";

export async function generateStream(prompt: string) {
  const { provider, apiKey, model } = loadConfig();

  const llm = getModel(provider, apiKey, model);

  const res = await runLLM(llm, prompt);

  return res;
}
