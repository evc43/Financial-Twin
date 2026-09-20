/**
 * relocationAdvisor.server.ts — turns the finished RelocationResult into
 * plain-language advice via Nemotron (OpenRouter, NVIDIA if that key exists).
 * Server-only. Server-only advisor.
 */

import type { RelocationAdvice, RelocationResult } from "./relocation.types";

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const NEMOTRON_MODEL = "nvidia/nemotron-3-super-120b-a12b";

const SYSTEM_PROMPT =
  `You are a relocation advisor. You are given the finished numbers from a deterministic analysis. Using ONLY those numbers, output JSON {headline, reasoning, recommendation}: headline = one line naming the real tradeoff using breakEvenSalary and surplusDelta; reasoning = 2-4 sentences on how the raise interacts with taxes, local city income tax, and cost of living to produce the real surplus change; recommendation = take it / it's a wash / reconsider, framed around the break-even. Never invent a number that isn't provided. Round to whole dollars.

Output ONLY minified JSON, no prose, no markdown, no code fences.`;

function endpoint(): { url: string; key: string; nvidia: boolean } {
  const nvidiaKey = process.env["NVIDIA_API_KEY"] || undefined;
  if (nvidiaKey) return { url: NVIDIA_URL, key: nvidiaKey, nvidia: true };
  const key = process.env["OPENROUTER_API_KEY"] || undefined;
  if (!key) throw new Error("Missing secret: OPENROUTER_API_KEY (add it in Cloud → Secrets)");
  return { url: OPENROUTER_URL, key, nvidia: false };
}

function parseJson<T>(raw: string): T {
  let s = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  s = s.replace(/^<think>[\s\S]*?<\/think>/i, "").trim();
  const start = s.search(/[{[]/);
  const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (start === -1 || end === -1) {
    throw new Error(`No JSON found in model output: ${raw.slice(0, 200)}`);
  }
  return JSON.parse(s.slice(start, end + 1)) as T;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function adviseRelocation(result: RelocationResult): Promise<RelocationAdvice> {
  const { url, key, nvidia } = endpoint();
  const body = JSON.stringify({
    model: NEMOTRON_MODEL,
    messages: [
      { role: "system", content: `/no_think\n${SYSTEM_PROMPT}` },
      { role: "user", content: `Analysis results:\n${JSON.stringify(result)}` },
    ],
    temperature: 0.3,
    top_p: 0.95,
    max_tokens: 500,
    ...(nvidia
      ? { chat_template_kwargs: { enable_thinking: false } }
      : { reasoning: { enabled: false } }),
  });

  const MAX_ATTEMPTS = 5;
  let lastStatus = 0;
  let lastText = "";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      return parseJson<RelocationAdvice>(data.choices?.[0]?.message?.content ?? "");
    }

    lastStatus = res.status;
    lastText = await res.text();

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS - 1) break;

    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 15000)
        : Math.min(1500 * 2 ** attempt, 12000) + Math.floor(Math.random() * 500);
    await sleep(waitMs);
  }

  if (lastStatus === 429) {
    throw new Error(
      "The analysis model is rate-limited upstream right now. Wait a moment and compare again.",
    );
  }
  throw new Error(`Nemotron failed: ${lastStatus} ${lastText}`);
}
