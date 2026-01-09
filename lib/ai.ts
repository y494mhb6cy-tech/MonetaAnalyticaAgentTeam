import { StructuredOutput, TaskRabbit, Mode, RunInput } from "./types";
import { buildPrompt, defaultMockOutput, safeJsonParse } from "./run-utils";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

export async function runTaskWithProvider(task: TaskRabbit, inputs: RunInput[], mode: Mode): Promise<StructuredOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return defaultMockOutput(task);
  }

  const prompt = buildPrompt(task, inputs, mode);

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a precise analyst producing structured JSON for MAOS." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    return defaultMockOutput(task);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  const parsed = safeJsonParse(content);
  return parsed ?? defaultMockOutput(task);
}
