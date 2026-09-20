/**
 * cascadePipeline.server.ts  —  THE "I/O + JUDGMENT" LAYER
 * Server-only. Reads PLAID_CLIENT_ID, PLAID_SECRET and the model key
 * (NVIDIA_API_KEY, falling back to OPENROUTER_API_KEY) from the environment.
 * Never imported by client code.
 */

import {
  detectCascade,
  type CashFlowModel,
  type CascadeResult,
  type PlaidTx,
} from "./cascadeEngine";
import type { CascadeInputs } from "./cascade.types";

// ================================================================
// 0. Config
// ================================================================

const PLAID_BASE = "https://sandbox.plaid.com";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const NEMOTRON_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const SANDBOX_INSTITUTION = "ins_109508"; // First Platypus Bank

function optionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

function getEnv(key: string): string {
  const v = optionalEnv(key);
  if (!v) throw new Error(`Missing secret: ${key} (add it in Cloud → Secrets)`);
  return v;
}

function modelEndpoint(): { url: string; key: string; nvidia: boolean } {
  const nvidiaKey = optionalEnv("NVIDIA_API_KEY");
  if (nvidiaKey) return { url: NVIDIA_URL, key: nvidiaKey, nvidia: true };
  return { url: OPENROUTER_URL, key: getEnv("OPENROUTER_API_KEY"), nvidia: false };
}

// ================================================================
// 1. PLAID — the demo fixture + the pull
// ================================================================

export function buildDemoCustomUser(inputs: CascadeInputs) {
  const transactions: {
    date_transacted: string;
    date_posted: string;
    amount: number;
    description: string;
    currency: string;
  }[] = [];

  const CYCLES = 5;
  const firstOfThisMonth = new Date();
  firstOfThisMonth.setUTCDate(1);
  firstOfThisMonth.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i < CYCLES; i++) {
    const monthStart = addMonths(firstOfThisMonth, -i);
    const payday = dayInMonth(monthStart, inputs.paydayOfMonth);
    const rent = dayInMonth(monthStart, inputs.rentDayOfMonth);

    push(transactions, payday, -inputs.monthlyIncome, "ACH DIRECT DEP PAYROLL EMPLOYERCO INC");
    push(transactions, rent, inputs.rentAmount, "AUTOPAY RENT SUNSET PROPERTY MGMT");

    // Overdraft fee whenever rent posts within ~5 days BEFORE the NEXT paycheck.
    // The next paycheck may be this month (rentDay < payDay) or next month
    // (rentDay > payDay, i.e. rent falls late and payday is early next month).
    const nextPayday =
      rent.getTime() < payday.getTime()
        ? payday
        : dayInMonth(addMonths(monthStart, 1), inputs.paydayOfMonth);
    const gapDays = Math.round((nextPayday.getTime() - rent.getTime()) / 86_400_000);
    if (gapDays > 0 && gapDays <= 5) {
      push(transactions, addDays(nextPayday, -1), 35, "OVERDRAFT FEE");
    }

    push(transactions, addDays(payday, 3), 92.41, "WHOLE FOODS MARKET");
    push(transactions, addDays(payday, 8), 11.99, "SPOTIFY USA");
    push(transactions, addDays(payday, 12), 63.2, "SHELL OIL 574");
    push(transactions, addDays(payday, 15), 15.99, "NETFLIX.COM");
    push(transactions, addDays(payday, 18), 47.83, "TARGET T-1187");

    if (i === CYCLES - 1) {
      push(transactions, addDays(payday, -0), 84, "RETURNED PAYMENT FEE CITY UTILITIES");
    }
  }

  return {
    override_accounts: [
      {
        type: "depository",
        subtype: "checking",
        starting_balance: inputs.checkingBalance,
        meta: { name: "Plaid Checking", mask: "0000" },
        numbers: { ach: [{ account: "1111222233330000", routing: "011401533" }] },
        transactions,
      },
    ],
  };

  function push(arr: typeof transactions, d: Date, amount: number, description: string) {
    const iso = d.toISOString().slice(0, 10);
    arr.push({ date_transacted: iso, date_posted: iso, amount, description, currency: "USD" });
  }
}

export async function pullDemoTransactions(inputs: CascadeInputs): Promise<PlaidTx[]> {
  const customUser = buildDemoCustomUser(inputs);

  const pt = await plaid("/sandbox/public_token/create", {
    institution_id: SANDBOX_INSTITUTION,
    initial_products: ["transactions"],
    options: {
      override_username: "user_custom",
      override_password: JSON.stringify(customUser),
      transactions: { days_requested: 365 },
    },
  });

  const ex = await plaid("/item/public_token/exchange", { public_token: pt.public_token });
  const accessToken: string = ex.access_token;

  await plaid("/transactions/refresh", { access_token: accessToken }).catch(() => {});

  // Sandbox transaction generation is asynchronous: the first sync often returns
  // only a partial first page. Re-sync from scratch until the count stops growing.
  let added: any[] = [];
  let stableRounds = 0;

  for (let attempt = 0; attempt < 12; attempt++) {
    if (attempt) await sleep(2000);

    // Full sync from scratch: keep calling with next_cursor until has_more is false.
    const page: any[] = [];
    let cursor: string | undefined;
    let pages = 0;
    while (pages < 100) {
      const sync = await plaid("/transactions/sync", {
        access_token: accessToken,
        count: 500,
        ...(cursor ? { cursor } : {}),
      });
      pages++;
      page.push(...(sync.added ?? []));
      cursor = sync.next_cursor;
      if (!sync.has_more) break;
    }

    if (page.length > added.length) {
      added = page;
      stableRounds = 0;
      continue; // still growing — sandbox is still generating
    }

    // Require two consecutive rounds with no growth before trusting the count.
    stableRounds++;
    if (added.length > 0 && stableRounds >= 2) break;
  }

  return added.map((t) => ({
    name: t.name as string,
    amount: t.amount as number,
    date: t.date as string,
  }));
}

async function plaid(path: string, body: Record<string, unknown>) {
  const res = await fetch(PLAID_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: getEnv("PLAID_CLIENT_ID"),
      secret: getEnv("PLAID_SECRET"),
      ...body,
    }),
  });
  if (!res.ok) {
    throw new Error(`Plaid ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// ================================================================
// 2. NEMOTRON — one shared caller, two jobs
// ================================================================

async function callNemotron(
  systemPrompt: string,
  userContent: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const { url, key, nvidia } = modelEndpoint();
  const body = JSON.stringify({
    model: NEMOTRON_MODEL,
    messages: [
      { role: "system", content: `/no_think\n${systemPrompt}` },
      { role: "user", content: userContent },
    ],
    temperature,
    top_p: 0.95,
    max_tokens: maxTokens,
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }

    lastStatus = res.status;
    lastText = await res.text();

    // Only 429 (rate limit) and 5xx are worth retrying; everything else is terminal.
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS - 1) break;

    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 15000)
      : Math.min(1500 * 2 ** attempt, 12000) + Math.floor(Math.random() * 500);
    await sleep(waitMs);
  }

  if (lastStatus === 429) {
    throw new Error(
      "The analysis model is rate-limited upstream right now. Wait a moment and press Detect Cascade again.",
    );
  }
  throw new Error(`Nemotron failed: ${lastStatus} ${lastText}`);
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

const STRUCTURE_SYSTEM_PROMPT =
  `You are a bank-transaction analyst. Convert a raw list of transactions into a structured monthly cash-flow model.

SIGN CONVENTION: a POSITIVE amount is money LEAVING the account (a debit/expense); a NEGATIVE amount is money ENTERING (a deposit/income).

Identify, using ONLY the transactions provided:
- income: the single recurring paycheck — the largest recurring deposit (negative amount). Report amount as a positive number and the day-of-month it usually lands.
- rent: the recurring housing payment (a large recurring debit, often "RENT", "PROPERTY", "MGMT", "APARTMENTS", "REALTY"). amount positive, plus its usual day-of-month.
- otherObligations: other recurring committed debits (subscriptions, loans, insurance).
- fees: every bank fee (descriptions containing OVERDRAFT, NSF, RETURNED, LATE, or similar). Give each its exact amount, its date, and a type of "overdraft", "nsf", "late", or "other".
- discretionaryMonthlyAvg: rough average monthly non-committed spending (groceries, gas, dining, shopping).

Do NOT invent any transaction, amount, or date. If something is absent, use null (for income/rent) or an empty array.

Output ONLY minified JSON, no prose, no markdown, no code fences, exactly this shape:
{"income":{"description":string,"amount":number,"dayOfMonth":number}|null,"rent":{"description":string,"amount":number,"dayOfMonth":number}|null,"otherObligations":[{"description":string,"amount":number,"dayOfMonth":number}],"fees":[{"description":string,"amount":number,"date":"YYYY-MM-DD","type":"overdraft"|"nsf"|"late"|"other"}],"discretionaryMonthlyAvg":number}`;

export async function structureTransactions(txns: PlaidTx[]): Promise<CashFlowModel> {
  const compact = txns.map((t) => ({ n: t.name, a: t.amount, d: t.date }));
  const raw = await callNemotron(
    STRUCTURE_SYSTEM_PROMPT,
    `Transactions (n=name, a=amount, d=date):\n${JSON.stringify(compact)}`,
    900,
    0,
  );
  return parseJson<CashFlowModel>(raw);
}

const EXPLAIN_SYSTEM_PROMPT =
  `You are a calm, plain-spoken financial coach. You are given the FINISHED numbers from a deterministic cash-flow analysis. Turn them into a short explanation the user reads on a results screen.

HARD RULES:
- Use ONLY the numbers in the input JSON. Never introduce or estimate any figure that is not there.
- Round every dollar amount to a whole dollar.
- The problem is one of TIMING, not overspending. Do not tell the user to spend less.
- The fix is to move the rent payment date to just after payday.
- Do not mention that you are an AI or that numbers were "provided to you".

Output ONLY minified JSON, no prose, no markdown, no code fences, exactly:
{"rootCause":string,"smallestFix":string,"narrative":string}
- rootCause: one sentence naming the timing problem (use gapDays).
- smallestFix: one sentence — the single smallest action (use daysToShift and recommendedNewRentDay).
- narrative: 2-4 sentences the user sees, referencing recurringMonthlyFee, projectionMonths, projectedFeeCost, and projectedSavings.`;

export interface CascadeExplanation {
  rootCause: string;
  smallestFix: string;
  narrative: string;
}

export async function explainCascade(result: CascadeResult): Promise<CascadeExplanation> {
  const facts = {
    gapDays: result.gapDays,
    recurringMonthlyFee: result.recurringMonthlyFee,
    observedFeeTotal: result.observedFeeTotal,
    projectionMonths: result.projectionMonths,
    projectedFeeCost: result.projectedFeeCost,
    recommendedNewRentDay: result.recommendedNewRentDay,
    daysToShift: result.daysToShift,
    projectedSavings: result.projectedSavings,
  };
  const raw = await callNemotron(
    EXPLAIN_SYSTEM_PROMPT,
    `Analysis results:\n${JSON.stringify(facts)}`,
    400,
    0.3,
  );
  return parseJson<CascadeExplanation>(raw);
}

// ================================================================
// 3. ORCHESTRATOR — one call the UI can hit
// ================================================================

export interface CascadeDemoResponse {
  transactionsPulled: number;
  firstTransaction: PlaidTx | null;
  model: CashFlowModel;
  cascade: CascadeResult;
  explanation: CascadeExplanation | null;
}

export async function runCascadeDemo(inputs: CascadeInputs): Promise<CascadeDemoResponse> {
  const txns = await pullDemoTransactions(inputs);
  const model = await structureTransactions(txns);
  const cascade = detectCascade(model, txns, { projectionMonths: 18, bufferDays: 2 });
  const explanation = cascade.detected ? await explainCascade(cascade) : null;

  return {
    transactionsPulled: txns.length,
    firstTransaction: txns[0] ?? null,
    model,
    cascade,
    explanation,
  };
}

// ---- date utils (fixture only) ----
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
function dayInMonth(monthStart: Date, day: number): Date {
  const daysInMonth = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const x = new Date(monthStart);
  x.setUTCDate(Math.min(day, daysInMonth));
  return x;
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
