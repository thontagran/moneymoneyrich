export type TransactionType = 'income' | 'expense';

export type TransactionCategory = 
  | 'salary' 
  | 'freelance' 
  | 'business' 
  | 'investment' 
  | 'other_income'
  | 'food' 
  | 'rent' 
  | 'transport' 
  | 'utilities' 
  | 'shopping' 
  | 'health' 
  | 'entertainment' 
  | 'other_expense';

export type BudgetRuleGroup = 'needs' | 'wants' | 'savings';

export type CategoryBudgets = Partial<Record<TransactionCategory, number>>;

export interface Transaction {
  id: number;
  desc: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
}

export type IncomeSectionType = '40_1_2' | '40_3' | '40_5' | '40_6' | '40_7_8';

export interface TaxDeductions {
  socialSec: number;
  lifeIns: number;
  healthIns: number;
  providentFund: number;
  ssf: number;
  rmf: number;
  thaiEsg: number;
  homeInterest: number;
  easyEReceipt: number;
  spouse: boolean;
  childrenCount: number;
  parentsCount: number;
  other: number;
}

export interface TaxBracketDetail {
  bracketIndex: number;
  min: number;
  max: number;
  rate: number;
  rateText: string;
  taxableAmount: number;
  taxInBracket: number;
  isActive: boolean;
  isFilled: boolean;
}

export interface TaxCalculationResult {
  annualIncome: number;
  expensesAllowed: number;
  deductionsAllowed: number;
  netIncome: number;
  totalTax: number;
  effectiveTaxRate: number;
  taxDetails: TaxBracketDetail[];
  bracketTaxSummary: {
    personal: number;
    family: number;
    socialSec: number;
    lifeAndHealth: number;
    retirement: number;
    thaiEsg: number;
    home: number;
    easyEReceipt: number;
    other: number;
  };
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface AssetAllocationItem {
  name: string;
  share: number;
  color: string;
  bgClass: string;
  desc: string;
  type: 'cash_bond' | 'thai_equity' | 'global_equity' | 'alternative';
}

export interface PortfolioRiskConfig {
  label: string;
  returnRate: number;
  description: string;
  assets: AssetAllocationItem[];
}

export interface ChartDataPoint {
  year: number;
  age: number;
  balance: number;
  principal: number;
  interest: number;
  realBalance: number;
  realPrincipal: number;
  realInterest: number;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isOfflineAnswer?: boolean;
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  budgets: CategoryBudgets;
  tax: {
    income: number;
    section: IncomeSectionType;
    deductions: TaxDeductions;
  };
  invest: {
    age: number;
    targetAge: number;
    capital: number;
    monthly: number;
    risk: RiskLevel;
    inflationRate: number;
    adjustInflation: boolean;
  };
  chat: ChatMessage[];
}
