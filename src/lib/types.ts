export type PaymentMethod = "pix" | "credit" | "debit" | "cash" | "boleto" | "other";
export type CategoryKind = "income" | "expense";
export type CategoryNature = "fixed" | "variable";

export interface Member {
  id: string;
  household_id: string;
  profile_id: string;
  display_name: string;
  color: string;
}

export interface Category {
  id: string;
  household_id: string;
  name: string;
  kind: CategoryKind;
  nature: CategoryNature;
  icon: string;
  color: string;
  description: string | null;
  active: boolean;
  sort_order: number;
}

export interface CategoryNote {
  id: string;
  household_id: string;
  month: string;
  category_id: string;
  notes: string | null;
}

export interface CreditCard {
  id: string;
  household_id: string;
  name: string;
  bank: string | null;
  credit_limit: number;
  monthly_goal: number;
  closing_day: number;
  due_day: number;
  active: boolean;
}

export interface ExpensePayment {
  id: string;
  monthly_expense_id: string;
  method: PaymentMethod;
  credit_card_id: string | null;
  amount: number;
}

export interface MonthlyExpense {
  id: string;
  household_id: string;
  month: string; // YYYY-MM-01
  category_id: string;
  member_id: string | null;
  total: number;
  payments: ExpensePayment[];
}

export interface MonthlyIncome {
  id: string;
  household_id: string;
  month: string;
  category_id: string;
  member_id: string | null;
  amount: number;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  credit: "Crédito",
  debit: "Débito",
  cash: "Dinheiro",
  boleto: "Boleto",
  other: "Outros",
};
