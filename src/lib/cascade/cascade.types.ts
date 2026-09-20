import type { CashFlowModel, CascadeResult, PlaidTx } from "./cascadeEngine";

export interface CascadeExplanation {
  rootCause: string;
  smallestFix: string;
  narrative: string;
}

export interface CascadeDemoResponse {
  transactionsPulled: number;
  firstTransaction: PlaidTx | null;
  model: CashFlowModel;
  cascade: CascadeResult;
  explanation: CascadeExplanation | null;
}
