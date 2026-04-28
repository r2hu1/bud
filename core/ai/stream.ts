import { loadConfig } from "../cli/config";
import { getModel } from "./providers";
import { runLLM } from "./run";

export async function generateStream(prompt: string) {
  const { provider, apiKey } = loadConfig();

  const model = getModel(provider, apiKey);

  let res = await runLLM(model, prompt);

  return res ?? "";
}
