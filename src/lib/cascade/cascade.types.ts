import type { CashFlowModel, CascadeResult, PlaidTx } from "./cascadeEngine";

export interface CascadeExplanation {
  rootCause: string;
  smallestFix: string;
  narrative: string;
}

/** The six values collected by the onboarding wizard. */
export interface CascadeInputs {
  monthlyIncome: number;
  paydayOfMonth: number;
  rentAmount: number;
  rentDayOfMonth: number;
  checkingBalance: number;
  monthlySpending: number;
}

export interface CascadeDemoResponse {
  transactionsPulled: number;
  firstTransaction: PlaidTx | null;
  model: CashFlowModel;
  cascade: CascadeResult;
  explanation: CascadeExplanation | null;
}
