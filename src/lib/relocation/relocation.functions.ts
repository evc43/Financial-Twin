import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { RelocationAnalyzeInputs, RelocationResult } from "./relocation.types";

const money = z.number().min(0).max(10_000_000);

const inputsSchema = z.object({
  currentCity: z.string().min(1).max(80),
  currentState: z.string().min(1).max(80),
  currentSalary: money,
  currentRent: money,
  monthlySpendingExRent: money,
  offerCity: z.string().min(1).max(80),
  offerState: z.string().min(1).max(80),
  offerSalary: money,
  offerRent: money.optional(),
});

export const relocationAnalyzeFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown): RelocationAnalyzeInputs => inputsSchema.parse(data))
  .handler(async ({ data }): Promise<RelocationResult> => {
    const { analyzeRelocation } = await import("./relocationEngine");
    const result = analyzeRelocation(
      {
        city: data.currentCity,
        state: data.currentState,
        grossSalary: data.currentSalary,
        rent: data.currentRent,
      },
      {
        city: data.offerCity,
        state: data.offerState,
        grossSalary: data.offerSalary,
        ...(data.offerRent !== undefined ? { rent: data.offerRent } : {}),
      },
      { monthlySpendingExRent: data.monthlySpendingExRent },
    );
  });
