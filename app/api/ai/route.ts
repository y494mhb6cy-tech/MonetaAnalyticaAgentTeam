import { buildMockResponse } from "../../../lib/ai-mock";

const getString = (value: unknown) => (typeof value === "string" ? value : "");

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const prompt = getString(body.prompt).trim();
  const context = getString(body.context);

  if (!prompt) {
    return Response.json({ error: "Prompt is required." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({
      mode: "mock",
      response: buildMockResponse(prompt, context),
      note: "OPENAI_API_KEY not set. Using mock preview."
    });
  }

  const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are the MAOS AI Preview. Provide concise, actionable responses for executive operators."
        },
        {
          role: "user",
          content: context ? `${prompt}\n\nContext:\n${context}` : prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 450
    })
  });

  if (!apiResponse.ok) {
    return Response.json({
      mode: "mock",
      response: buildMockResponse(prompt, context),
      note: "OpenAI API unavailable. Using mock preview."
    });
  }

  const data = (await apiResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const responseText = data.choices?.[0]?.message?.content?.trim() || "No response returned.";

  return Response.json({ mode: "real", response: responseText });
}
