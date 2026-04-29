import { stepCountIs, streamText } from "ai";
import { SYSTEM_PROMPT } from "./system-prompt";
import { tools } from "./tools";

export async function runLLM(model: any, prompt: string) {
  try {
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt,
      tools: tools,
      stopWhen: stepCountIs(20),
    });

    let full = "";

    for await (const chunk of result.textStream) {
      // process.stdout.write(chunk);
      full += chunk;
    }

    return full;
  } catch (e) {
    return null;
  }
}
