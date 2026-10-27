import { RiskLevel, PortfolioRiskConfig, ChartDataPoint } from '../types';

export const PORTFOLIO_CONFIGS: Record<RiskLevel, PortfolioRiskConfig> = {
  low: {
    label: 'ความเสี่ยงต่ำ (เน้นอนุรักษ์เงินต้น)',
    returnRate: 0.035,
    description: 'เหมาะสำหรับผู้ที่ต้องการความมั่นคงสูง ใกล้เกษียณ หรือไม่ชอบความผันผวน',
    assets: [
      { name: 'เงินฝากประจำ / สภาพคล่อง', share: 20, color: '#94a3b8', bgClass: 'bg-slate-400', desc: 'สภาพคล่องฉุกเฉิน ปลอดภัยสูง', type: 'cash_bond' },
      { name: 'พันธบัตรรัฐบาลไทย', share: 60, color: '#10b981', bgClass: 'bg-emerald-500', desc: 'ความเสี่ยงต่ำ ผลตอบแทนสม่ำเสมอ', type: 'cash_bond' },
      { name: 'หุ้นกู้เอกชน Investment Grade', share: 15, color: '#059669', bgClass: 'bg-emerald-600', desc: 'ผลตอบแทนเพิ่มขึ้นจากพันธบัตร', type: 'cash_bond' },
      { name: 'ทองคำแท่ง / Gold ETF', share: 5, color: '#f59e0b', bgClass: 'bg-amber-500', desc: 'ประกันความเสี่ยงเงินเฟ้อ', type: 'alternative' },
    ],
  },
  medium: {
    label: 'ความเสี่ยงปานกลาง (สมดุลเติบโต)',
    returnRate: 0.07,
    description: 'เหมาะสำหรับวัยทำงาน กระจายความเสี่ยงหุ้นและตราสารหนี้อย่างลงตัว',
    assets: [
      { name: 'พันธบัตร & ตราสารหนี้', share: 30, color: '#10b981', bgClass: 'bg-emerald-500', desc: 'ลดความผันผวน รักษามูลค่าเงินต้น', type: 'cash_bond' },
      { name: 'กองทุนดัชนีหุ้นไทย (SET50)', share: 25, color: '#3b82f6', bgClass: 'bg-blue-500', desc: 'เติบโตตามเศรษฐกิจไทย', type: 'thai_equity' },
      { name: 'หุ้นโลก & S&P 500 (Global)', share: 30, color: '#6366f1', bgClass: 'bg-indigo-500', desc: 'กระจายลงทุนบริษัทชั้นนำทั่วโลก', type: 'global_equity' },
      { name: 'อสังหาฯ REITs & ทองคำ', share: 15, color: '#f59e0b', bgClass: 'bg-amber-500', desc: 'รายได้เงินปันผลสม่ำเสมอ + ป้องกันเงินเฟ้อ', type: 'alternative' },
    ],
  },
  high: {
    label: 'ความเสี่ยงสูง (เน้นเติบโตเต็มที่)',
    returnRate: 0.1,
    description: 'เหมาะสำหรับระยะยาว 10+ ปี รับความผันผวนได้เพื่อผลตอบแทนก้าวกระโดด',
    assets: [
      { name: 'ตราสารหนี้ระยะสั้น', share: 10, color: '#10b981', bgClass: 'bg-emerald-500', desc: 'เงินสำรองรอจังหวะเข้าช้อนซื้อ', type: 'cash_bond' },
      { name: 'หุ้นไทยศักยภาพสูง', share: 20, color: '#3b82f6', bgClass: 'bg-blue-500', desc: 'หุ้นเติบโตและหุ้นปันผลเด่น', type: 'thai_equity' },
      { name: 'หุ้นเทคโนโลยี & Megatrend โลก', share: 50, color: '#6366f1', bgClass: 'bg-indigo-500', desc: 'ขับเคลื่อนด้วย AI, Semiconductor, Cloud', type: 'global_equity' },
      { name: 'สินทรัพย์ทางเลือก (ทอง / คริปโต / REITs)', share: 20, color: '#ec4899', bgClass: 'bg-pink-500', desc: 'ผลตอบแทนคาดหวังสูง กระจายความเสี่ยง', type: 'alternative' },
    ],
  },
};

export interface CompoundSimulationResult {
  points: ChartDataPoint[];
  totalSaved: number;
  finalWealth: number;
  profit: number;
  finalRealWealth: number;
  realTotalSaved: number;
  realProfit: number;
  monthlySafeWithdrawalNominal: number;
  monthlySafeWithdrawalReal: number;
}

export function simulateCompoundGrowth(
  startAge: number,
  targetAge: number,
  initialCapital: number,
  monthlySave: number,
  annualReturn: number,
  annualInflationRate = 0.025
): CompoundSimulationResult {
  const years = Math.max(1, targetAge - startAge);
  const monthlyRate = annualReturn / 12;

  let currentBalance = Math.max(0, initialCapital);
  let currentPrincipal = Math.max(0, initialCapital);

  const points: ChartDataPoint[] = [];

  for (let y = 0; y <= years; y++) {
    const age = startAge + y;
    const inflationDiscount = Math.pow(1 + Math.max(0, annualInflationRate), y);

    const nominalBal = Math.round(currentBalance);
    const nominalPrin = Math.round(currentPrincipal);
    const nominalInt = Math.round(Math.max(0, currentBalance - currentPrincipal));

    const realBal = Math.round(currentBalance / inflationDiscount);
    const realPrin = Math.round(currentPrincipal / inflationDiscount);
    const realInt = Math.round(Math.max(0, realBal - realPrin));

    points.push({
      year: y,
      age,
      balance: nominalBal,
      principal: nominalPrin,
      interest: nominalInt,
      realBalance: realBal,
      realPrincipal: realPrin,
      realInterest: realInt,
    });

    if (y < years) {
      for (let m = 0; m < 12; m++) {
        currentBalance = (currentBalance + monthlySave) * (1 + monthlyRate);
        currentPrincipal += monthlySave;
      }
    }
  }

  const finalPoint = points[points.length - 1];

  // 4% Safe Withdrawal Rule (Trinity Study: 4% per year / 12 months)
  const monthlySafeWithdrawalNominal = Math.round((finalPoint.balance * 0.04) / 12);
  const monthlySafeWithdrawalReal = Math.round((finalPoint.realBalance * 0.04) / 12);

  return {
    points,
    totalSaved: finalPoint.principal,
    finalWealth: finalPoint.balance,
    profit: finalPoint.interest,
    finalRealWealth: finalPoint.realBalance,
    realTotalSaved: finalPoint.realPrincipal,
    realProfit: finalPoint.realInterest,
    monthlySafeWithdrawalNominal,
    monthlySafeWithdrawalReal,
  };
}

export function findMilestones(points: ChartDataPoint[], useRealPurchasingPower = false) {
  const targets = [
    { target: 1000000, label: '1 ล้านแรก (First Million)' },
    { target: 3000000, label: '3 ล้าน (ความมั่นคงพื้นฐาน)' },
    { target: 5000000, label: '5 ล้าน (อิสรภาพขั้นต้น)' },
    { target: 10000000, label: '10 ล้าน (เกษียณสุขใจ)' },
  ];

  return targets.map((t) => {
    const hit = points.find((p) =>
      useRealPurchasingPower ? p.realBalance >= t.target : p.balance >= t.target
    );
    return {
      label: t.label,
      targetAmount: t.target,
      achievedAge: hit ? hit.age : null,
      yearsNeeded: hit ? hit.year : null,
    };
  });
}
