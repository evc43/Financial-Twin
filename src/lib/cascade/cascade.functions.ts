import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { CascadeDemoResponse, CascadeInputs } from "./cascade.types";

const day = z.number().int().min(1).max(31);
const money = z.number().min(0).max(1_000_000);

const inputsSchema = z.object({
  monthlyIncome: money,
  paydayOfMonth: day,
  rentAmount: money,
  rentDayOfMonth: day,
  checkingBalance: money,
  monthlySpending: money,
});

export const runCascadeDemoFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown): CascadeInputs => inputsSchema.parse(data))
  .handler(async ({ data }): Promise<CascadeDemoResponse> => {
    const { runCascadeDemo } = await import("./cascadePipeline.server");
    return await runCascadeDemo(data);
  });
