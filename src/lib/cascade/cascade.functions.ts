import { createServerFn } from "@tanstack/react-start";

import type { CascadeDemoResponse } from "./cascade.types";

export const runCascadeDemoFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<CascadeDemoResponse> => {
    const { runCascadeDemo } = await import("./cascadePipeline.server");
    return await runCascadeDemo();
  },
);
