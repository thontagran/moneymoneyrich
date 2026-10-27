import { TaxDeductions, IncomeSectionType, TaxCalculationResult, TaxBracketDetail } from '../types';

export const THAI_TAX_BRACKETS = [
  { min: 0, max: 150000, rate: 0, label: '0 - 1.5 แสน', color: '#10b981' },
  { min: 150000, max: 300000, rate: 0.05, label: '1.5 แสน - 3 แสน', color: '#34d399' },
  { min: 300000, max: 500000, rate: 0.10, label: '3 แสน - 5 แสน', color: '#38bdf8' },
  { min: 500000, max: 750000, rate: 0.15, label: '5 แสน - 7.5 แสน', color: '#60a5fa' },
  { min: 750000, max: 1000000, rate: 0.20, label: '7.5 แสน - 1 ล้าน', color: '#818cf8' },
  { min: 1000000, max: 2000000, rate: 0.25, label: '1 ล้าน - 2 ล้าน', color: '#a78bfa' },
  { min: 2000000, max: 5000000, rate: 0.30, label: '2 ล้าน - 5 ล้าน', color: '#f472b6' },
  { min: 5000000, max: Infinity, rate: 0.35, label: 'เกิน 5 ล้านขึ้นไป', color: '#ef4444' },
];

export const INCOME_SECTIONS: { id: IncomeSectionType; label: string; expenseDesc: string }[] = [
  {
    id: '40_1_2',
    label: 'ม.40(1),(2) เงินเดือน / โบนัส / รับจ้างทั่วไป',
    expenseDesc: 'หักค่าใช้จ่าย 50% สูงสุด 100,000 บาท',
  },
  {
    id: '40_3',
    label: 'ม.40(3) ค่าลิขสิทธิ์ / สิทธิบัตร / ค่ากู๊ดวิลล์',
    expenseDesc: 'หักค่าใช้จ่าย 50% สูงสุด 100,000 บาท',
  },
  {
    id: '40_5',
    label: 'ม.40(5) ค่าเช่าบ้าน / อาคาร / ทรัพย์สิน',
    expenseDesc: 'หักค่าใช้จ่ายตามอัตราเหมา 30%',
  },
  {
    id: '40_6',
    label: 'ม.40(6) วิชาชีพอิสระ (แพทย์ / ทนาย / บัญชี)',
    expenseDesc: 'หักค่าใช้จ่ายตามอัตราเหมา 30% - 60%',
  },
  {
    id: '40_7_8',
    label: 'ม.40(7),(8) ธุรกิจการค้า / ขายของออนไลน์ / รับเหมา',
    expenseDesc: 'หักค่าใช้จ่ายตามอัตราเหมา 60%',
  },
];

export function calculateExpenses(annualIncome: number, incomeType: IncomeSectionType): number {
  if (annualIncome <= 0) return 0;
  switch (incomeType) {
    case '40_1_2':
    case '40_3':
      return Math.min(annualIncome * 0.5, 100000);
    case '40_5':
    case '40_6':
      return annualIncome * 0.3;
    case '40_7_8':
      return annualIncome * 0.6;
    default:
      return 0;
  }
}

export function calculateAllowedDeductions(annualIncome: number, deductions: TaxDeductions) {
  const personal = 60000;

  // Family allowances: Spouse (no income) 60k, Children 30k each, Parents 30k each (max 4 = 120k)
  const spouseAllowance = deductions.spouse ? 60000 : 0;
  const childrenAllowance = Math.max(0, Math.min(10, Math.floor(deductions.childrenCount || 0))) * 30000;
  const parentsAllowance = Math.max(0, Math.min(4, Math.floor(deductions.parentsCount || 0))) * 30000;
  const family = spouseAllowance + childrenAllowance + parentsAllowance;

  // Health insurance max 25,000; Life + Health combined max 100,000
  const allowedHealth = Math.min(Math.max(0, deductions.healthIns || 0), 25000);
  const allowedLifeAndHealth = Math.min(Math.max(0, deductions.lifeIns || 0) + allowedHealth, 100000);

  // Retirement cluster: SSF max 30% <= 200k; RMF max 30% <= 500k; PVD max 15% <= 500k; Combined <= 500k
  const allowedSSF = Math.min(Math.max(0, deductions.ssf || 0), annualIncome * 0.3, 200000);
  const allowedRMF = Math.min(Math.max(0, deductions.rmf || 0), annualIncome * 0.3, 500000);
  const allowedPVD = Math.min(Math.max(0, deductions.providentFund || 0), annualIncome * 0.15, 500000);
  const totalRetirement = Math.min(allowedSSF + allowedRMF + allowedPVD, 500000);

  // ThaiESG: separate cap! Max 30% of assessable income, up to 300,000 THB (held 5 years)
  const allowedThaiEsg = Math.min(Math.max(0, deductions.thaiEsg || 0), annualIncome * 0.3, 300000);

  // Social Security: max 9,000
  const allowedSocialSec = Math.min(Math.max(0, deductions.socialSec || 0), 9000);

  // Home loan interest: max 100,000
  const allowedHome = Math.min(Math.max(0, deductions.homeInterest || 0), 100000);

  // Easy E-Receipt: max 50,000
  const allowedEasyEReceipt = Math.min(Math.max(0, deductions.easyEReceipt || 0), 50000);

  // Other / donation
  const allowedOther = Math.max(0, deductions.other || 0);

  const total =
    personal +
    family +
    allowedLifeAndHealth +
    totalRetirement +
    allowedThaiEsg +
    allowedSocialSec +
    allowedHome +
    allowedEasyEReceipt +
    allowedOther;

  return {
    personal,
    family,
    socialSec: allowedSocialSec,
    lifeAndHealth: allowedLifeAndHealth,
    retirement: totalRetirement,
    thaiEsg: allowedThaiEsg,
    home: allowedHome,
    easyEReceipt: allowedEasyEReceipt,
    other: allowedOther,
    total,
  };
}

export function computeProgressiveTax(netIncome: number): number {
  let tax = 0;
  for (const b of THAI_TAX_BRACKETS) {
    if (netIncome > b.min) {
      const taxable = Math.min(
        netIncome - b.min,
        b.max === Infinity ? Infinity : b.max - b.min
      );
      tax += taxable * b.rate;
    }
  }
  return tax;
}

export function computeThaiTax(
  annualIncome: number,
  incomeType: IncomeSectionType,
  deductions: TaxDeductions
): TaxCalculationResult {
  const expensesAllowed = calculateExpenses(annualIncome, incomeType);
  const deductionSummary = calculateAllowedDeductions(annualIncome, deductions);
  const deductionsAllowed = deductionSummary.total;

  const netIncome = Math.max(0, annualIncome - expensesAllowed - deductionsAllowed);

  let totalTax = 0;
  const taxDetails: TaxBracketDetail[] = [];

  for (let i = 0; i < THAI_TAX_BRACKETS.length; i++) {
    const bracket = THAI_TAX_BRACKETS[i];
    const bracketSpan = bracket.max === Infinity ? Infinity : bracket.max - bracket.min;

    let taxableAmount = 0;
    let taxInBracket = 0;
    let isActive = false;
    let isFilled = false;

    if (netIncome > bracket.min) {
      isActive = true;
      if (bracket.max !== Infinity && netIncome >= bracket.max) {
        taxableAmount = bracketSpan;
        isFilled = true;
      } else {
        taxableAmount = netIncome - bracket.min;
      }
      taxInBracket = taxableAmount * bracket.rate;
      totalTax += taxInBracket;
    }

    taxDetails.push({
      bracketIndex: i,
      min: bracket.min,
      max: bracket.max,
      rate: bracket.rate,
      rateText: `${bracket.rate * 100}%`,
      taxableAmount,
      taxInBracket,
      isActive,
      isFilled,
    });
  }

  const effectiveTaxRate = annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;

  return {
    annualIncome,
    expensesAllowed,
    deductionsAllowed,
    netIncome,
    totalTax,
    effectiveTaxRate,
    taxDetails,
    bracketTaxSummary: deductionSummary,
  };
}

export function formatTHB(amount: number, showDecimals = false): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('th-TH').format(Math.round(amount));
}
