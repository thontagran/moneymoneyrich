import {
  Transaction,
  TaxDeductions,
  IncomeSectionType,
  RiskLevel,
  ChatMessage,
  CategoryBudgets,
  BackupPayload,
} from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'wealthnavi_transactions_v2',
  BUDGETS: 'wealthnavi_budgets_v1',
  TAX_INCOME: 'wealthnavi_tax_income_v1',
  TAX_SECTION: 'wealthnavi_tax_section_v1',
  TAX_DEDUCTIONS: 'wealthnavi_tax_deductions_v2',
  INVEST_AGE: 'wealthnavi_invest_age_v1',
  INVEST_TARGET_AGE: 'wealthnavi_invest_target_age_v1',
  INVEST_CAPITAL: 'wealthnavi_invest_capital_v1',
  INVEST_MONTHLY: 'wealthnavi_invest_monthly_v1',
  INVEST_RISK: 'wealthnavi_invest_risk_v1',
  INVEST_INFLATION: 'wealthnavi_invest_inflation_v1',
  INVEST_ADJUST_INFLATION: 'wealthnavi_invest_adjust_inf_v1',
  CHAT_MESSAGES: 'wealthnavi_chat_messages_v1',
  DARK_MODE: 'wealthnavi_dark_mode_v1',
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // September 2026
  { id: 101, desc: 'เงินเดือนประจำ ก.ย.', amount: 52000, type: 'income', category: 'salary', date: '2026-09-01' },
  { id: 102, desc: 'งานที่ปรึกษาเสริม', amount: 12000, type: 'income', category: 'freelance', date: '2026-09-10' },
  { id: 103, desc: 'ค่าเช่าคอนโด', amount: 9500, type: 'expense', category: 'rent', date: '2026-09-02' },
  { id: 104, desc: 'ค่าอาหาร & ซูเปอร์มาร์เก็ต', amount: 7800, type: 'expense', category: 'food', date: '2026-09-14' },
  { id: 105, desc: 'ค่าน้ำ-ค่าไฟ-อินเทอร์เน็ต', amount: 2350, type: 'expense', category: 'utilities', date: '2026-09-18' },
  { id: 106, desc: 'ออมลงทุน DCA รายเดือน', amount: 8000, type: 'expense', category: 'investment', date: '2026-09-25' },
  // October 2026
  { id: 201, desc: 'เงินเดือนประจำ ต.ค.', amount: 52000, type: 'income', category: 'salary', date: '2026-10-01' },
  { id: 202, desc: 'โปรเจกต์ฟรีแลนซ์ออกแบบ', amount: 15000, type: 'income', category: 'freelance', date: '2026-10-08' },
  { id: 203, desc: 'ค่าเช่าคอนโด', amount: 9500, type: 'expense', category: 'rent', date: '2026-10-02' },
  { id: 204, desc: 'ค่าอาหาร & กาแฟรายวัน', amount: 7200, type: 'expense', category: 'food', date: '2026-10-12' },
  { id: 205, desc: 'BTS & เดินทางในเมือง', amount: 2100, type: 'expense', category: 'transport', date: '2026-10-15' },
  { id: 206, desc: 'ค่าน้ำ-ค่าไฟ-อินเทอร์เน็ต', amount: 2400, type: 'expense', category: 'utilities', date: '2026-10-18' },
  { id: 207, desc: 'ซื้อเสื้อผ้า & ของใช้ส่วนตัว', amount: 3200, type: 'expense', category: 'shopping', date: '2026-10-20' },
  { id: 208, desc: 'กองทุน ThaiESG / DCA หุ้นโลก', amount: 8000, type: 'expense', category: 'investment', date: '2026-10-25' },
];

export const INITIAL_BUDGETS: CategoryBudgets = {
  rent: 10000,
  food: 9000,
  transport: 3500,
  utilities: 3000,
  shopping: 4000,
  health: 2500,
  entertainment: 3000,
  other_expense: 2000,
};

export const INITIAL_TAX_DEDUCTIONS: TaxDeductions = {
  socialSec: 9000,
  lifeIns: 45000,
  healthIns: 15000,
  providentFund: 30000,
  ssf: 35000,
  rmf: 0,
  thaiEsg: 50000,
  homeInterest: 24000,
  easyEReceipt: 15000,
  spouse: false,
  childrenCount: 0,
  parentsCount: 0,
  other: 0,
};

export const EMPTY_TAX_DEDUCTIONS: TaxDeductions = {
  socialSec: 0,
  lifeIns: 0,
  healthIns: 0,
  providentFund: 0,
  ssf: 0,
  rmf: 0,
  thaiEsg: 0,
  homeInterest: 0,
  easyEReceipt: 0,
  spouse: false,
  childrenCount: 0,
  parentsCount: 0,
  other: 0,
};

export function loadStoredTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
    return INITIAL_TRANSACTIONS;
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

export function loadStoredBudgets(): CategoryBudgets {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') return parsed;
    }
    return INITIAL_BUDGETS;
  } catch {
    return INITIAL_BUDGETS;
  }
}

export function saveStoredBudgets(budgets: CategoryBudgets): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (e) {
    console.warn('Budgets save failed:', e);
  }
}

export function loadStoredTaxState() {
  try {
    const income = localStorage.getItem(STORAGE_KEYS.TAX_INCOME);
    const section = localStorage.getItem(STORAGE_KEYS.TAX_SECTION);
    const deductionsRaw = localStorage.getItem(STORAGE_KEYS.TAX_DEDUCTIONS);
    const parsedDeductions = deductionsRaw ? JSON.parse(deductionsRaw) : null;
    return {
      income: income !== null ? Number(income) : 720000,
      section: (section as IncomeSectionType) || '40_1_2',
      deductions: (parsedDeductions
        ? { ...EMPTY_TAX_DEDUCTIONS, ...parsedDeductions }
        : INITIAL_TAX_DEDUCTIONS) as TaxDeductions,
    };
  } catch {
    return {
      income: 720000,
      section: '40_1_2' as IncomeSectionType,
      deductions: INITIAL_TAX_DEDUCTIONS,
    };
  }
}

export function saveStoredTaxState(
  income: number,
  section: IncomeSectionType,
  deductions: TaxDeductions
): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TAX_INCOME, String(income));
    localStorage.setItem(STORAGE_KEYS.TAX_SECTION, section);
    localStorage.setItem(STORAGE_KEYS.TAX_DEDUCTIONS, JSON.stringify(deductions));
  } catch (e) {
    console.warn('Tax storage save failed:', e);
  }
}

export function loadStoredInvestState() {
  try {
    const age = localStorage.getItem(STORAGE_KEYS.INVEST_AGE);
    const targetAge = localStorage.getItem(STORAGE_KEYS.INVEST_TARGET_AGE);
    const capital = localStorage.getItem(STORAGE_KEYS.INVEST_CAPITAL);
    const monthly = localStorage.getItem(STORAGE_KEYS.INVEST_MONTHLY);
    const risk = localStorage.getItem(STORAGE_KEYS.INVEST_RISK);
    const inflation = localStorage.getItem(STORAGE_KEYS.INVEST_INFLATION);
    const adjustInf = localStorage.getItem(STORAGE_KEYS.INVEST_ADJUST_INFLATION);
    return {
      age: age !== null ? Number(age) : 28,
      targetAge: targetAge !== null ? Number(targetAge) : 60,
      capital: capital !== null ? Number(capital) : 100000,
      monthly: monthly !== null ? Number(monthly) : 8000,
      risk: (risk as RiskLevel) || 'medium',
      inflationRate: inflation !== null ? Number(inflation) : 2.5,
      adjustInflation: adjustInf === 'true',
    };
  } catch {
    return {
      age: 28,
      targetAge: 60,
      capital: 100000,
      monthly: 8000,
      risk: 'medium' as RiskLevel,
      inflationRate: 2.5,
      adjustInflation: false,
    };
  }
}

export function saveStoredInvestState(
  age: number,
  targetAge: number,
  capital: number,
  monthly: number,
  risk: RiskLevel,
  inflationRate: number,
  adjustInflation: boolean
): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INVEST_AGE, String(age));
    localStorage.setItem(STORAGE_KEYS.INVEST_TARGET_AGE, String(targetAge));
    localStorage.setItem(STORAGE_KEYS.INVEST_CAPITAL, String(capital));
    localStorage.setItem(STORAGE_KEYS.INVEST_MONTHLY, String(monthly));
    localStorage.setItem(STORAGE_KEYS.INVEST_RISK, risk);
    localStorage.setItem(STORAGE_KEYS.INVEST_INFLATION, String(inflationRate));
    localStorage.setItem(STORAGE_KEYS.INVEST_ADJUST_INFLATION, String(adjustInflation));
  } catch (e) {
    console.warn('Invest storage save failed:', e);
  }
}

export function loadStoredDarkMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
  } catch {
    return false;
  }
}

export function saveStoredDarkMode(isDark: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDark));
  } catch (e) {
    console.warn('Dark mode save failed:', e);
  }
}

export function getInitialChatMessages(): ChatMessage[] {
  return [
    {
      id: 1,
      sender: 'ai',
      text: `สวัสดีครับ ยินดีต้อนรับสู่ WealthNavi AI ผู้ช่วยการเงินส่วนตัวของคุณ

พร้อมทำงานแบบออฟไลน์ 100% คำนวณภาษี (รวม ThaiESG & Easy E-Receipt) จำลองพอร์ตหักเงินเฟ้อ และวิเคราะห์งบรายเดือนได้ทันที

ลองแตะหัวข้อด่วนด้านล่างหรือพิมพ์ถามได้เลยครับ:
• "เปรียบเทียบ ThaiESG vs SSF vs RMF"
• "กฎ 4% ถอนเงินใช้หลังเกษียณคืออะไร?"
• "วิเคราะห์สุขภาพการเงินของฉันตอนนี้"
• "มีเงิน 100,000 บาท จัดพอร์ตยังไงดี?"`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    },
  ];
}

export function loadStoredChat(): ChatMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return getInitialChatMessages();
}

export function saveStoredChat(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages.slice(-40)));
  } catch (e) {
    console.warn('Chat storage save failed:', e);
  }
}

/* =========================================================
   OFFLINE EXPORT & BACKUP HELPERS (CSV & JSON)
   ========================================================= */

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categoryLabels: Record<string, string>,
  suffix = 'all'
): void {
  const headers = ['วันที่', 'ประเภท', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน (บาท)'];
  const rows = transactions.map((t) => {
    const typeLabel = t.type === 'income' ? 'รายรับ' : 'รายจ่าย';
    const catLabel = categoryLabels[t.category] || t.category;
    const escapedDesc = `"${String(t.desc).replace(/"/g, '""')}"`;
    return [t.date, typeLabel, `"${catLabel}"`, escapedDesc, t.amount.toFixed(2)].join(',');
  });

  // Prepend UTF-8 BOM so Microsoft Excel renders Thai characters properly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStamp = new Date().toISOString().split('T')[0];
  triggerBrowserDownload(blob, `wealthnavi-cashflow-${suffix}-${dateStamp}.csv`);
}

export function exportFullBackupJSON(payload: BackupPayload): void {
  const jsonContent = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const dateStamp = new Date().toISOString().split('T')[0];
  triggerBrowserDownload(blob, `wealthnavi-backup-${dateStamp}.json`);
}

export function parseBackupJSON(rawText: string): BackupPayload | null {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transactions)) {
      return null;
    }

    return {
      version: Number(parsed.version) || 1,
      exportedAt: String(parsed.exportedAt || new Date().toISOString()),
      transactions: parsed.transactions,
      budgets: parsed.budgets && typeof parsed.budgets === 'object' ? parsed.budgets : INITIAL_BUDGETS,
      tax: {
        income: Number(parsed.tax?.income ?? 720000),
        section: (parsed.tax?.section as IncomeSectionType) || '40_1_2',
        deductions: {
          ...INITIAL_TAX_DEDUCTIONS,
          ...(parsed.tax?.deductions || {}),
        },
      },
      invest: {
        age: Number(parsed.invest?.age ?? 28),
        targetAge: Number(parsed.invest?.targetAge ?? 60),
        capital: Number(parsed.invest?.capital ?? 100000),
        monthly: Number(parsed.invest?.monthly ?? 8000),
        risk: (parsed.invest?.risk as RiskLevel) || 'medium',
        inflationRate: Number(parsed.invest?.inflationRate ?? 2.5),
        adjustInflation: Boolean(parsed.invest?.adjustInflation),
      },
      chat: Array.isArray(parsed.chat) && parsed.chat.length > 0 ? parsed.chat : getInitialChatMessages(),
    };
  } catch {
    return null;
  }
}
