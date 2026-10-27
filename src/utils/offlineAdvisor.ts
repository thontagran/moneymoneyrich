import { Transaction, TaxCalculationResult } from '../types';
import { formatTHB } from './thaiTax';

export interface FinancialHealthReport {
  score: number;
  savingsRate: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netMonthly: number;
  grade: 'ยอดเยี่ยม (A+)' | 'ดีมาก (A)' | 'ปานกลาง (B)' | 'ควรปรับปรุง (C)';
  recommendations: string[];
}

export function evaluateFinancialHealth(
  transactions: Transaction[],
  taxResult?: TaxCalculationResult
): FinancialHealthReport {
  // Evaluate based on latest month if multiple months exist, otherwise total
  const months = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort();
  const latestMonth = months[months.length - 1];
  const scopedTx = latestMonth
    ? transactions.filter((t) => t.date.startsWith(latestMonth))
    : transactions;

  const income = scopedTx.filter((t) => t.type === 'income').reduce((acc, c) => acc + c.amount, 0);
  const dcaInvest = scopedTx
    .filter((t) => t.type === 'expense' && t.category === 'investment')
    .reduce((acc, c) => acc + c.amount, 0);
  const nonInvestExpense = scopedTx
    .filter((t) => t.type === 'expense' && t.category !== 'investment')
    .reduce((acc, c) => acc + c.amount, 0);
  const totalOutflow = nonInvestExpense + dcaInvest;

  const net = income - totalOutflow;
  const effectiveSavings = Math.max(0, net) + dcaInvest;
  const savingsRate = income > 0 ? (effectiveSavings / income) * 100 : 0;

  let score = 50;
  const recommendations: string[] = [];

  if (savingsRate >= 30) {
    score += 35;
    recommendations.push(
      '• อัตราการออมและลงทุนยอดเยี่ยม (>30%) แนะนำกระจายเงินออมส่วนเกินในกองทุนดัชนีหุ้นโลก (S&P 500 / MSCI World) และใช้สิทธิ ThaiESG เต็มเพดาน'
    );
  } else if (savingsRate >= 20) {
    score += 25;
    recommendations.push(
      '• อัตราการออมผ่านเกณฑ์มาตรฐาน 20% ตามกฎ 50/30/20 ลองตั้งเป้าขยับสู่ 25–30% เมื่อรายได้เพิ่มขึ้น'
    );
  } else if (savingsRate > 0) {
    score += 5;
    recommendations.push(
      '• อัตราการออมยังต่ำกว่า 20% แนะนำตั้งหักเงินออมอัตโนมัติ (DCA) ทันทีในวันเงินเดือนออก และตรวจสอบงบหมวดช้อปปิ้ง/บันเทิง'
    );
  } else {
    score -= 20;
    recommendations.push(
      '• รายจ่ายสูงกว่ารายรับในเดือนล่าสุด ควรกำหนดงบประมาณรายหมวดหมู่ (Category Budget) ในหน้ากระแสเงินสดอย่างเร่งด่วน'
    );
  }

  const targetEmergency = nonInvestExpense * 6;
  recommendations.push(
    `• ควรมีเงินสำรองฉุกเฉิน 6 เท่าของค่าใช้จ่ายจำเป็น ประมาณ ${formatTHB(targetEmergency)} เก็บในบัญชีออมทรัพย์ดิจิทัลดอกเบี้ยสูง`
  );

  if (taxResult && taxResult.totalTax > 0) {
    recommendations.push(
      `• ปัจจุบันคุณมีภาระภาษีประมาณ ${formatTHB(taxResult.totalTax)} (อัตราจริง ${taxResult.effectiveTaxRate.toFixed(1)}%) ลองตรวจสอบสิทธิคงเหลือของ ThaiESG (สูงสุด 300,000 บ.) และ RMF/SSF ในแท็บภาษี`
    );
  }

  let grade: FinancialHealthReport['grade'] = 'ปานกลาง (B)';
  if (score >= 85) grade = 'ยอดเยี่ยม (A+)';
  else if (score >= 70) grade = 'ดีมาก (A)';
  else if (score >= 50) grade = 'ปานกลาง (B)';
  else grade = 'ควรปรับปรุง (C)';

  return {
    score: Math.min(100, Math.max(10, score)),
    savingsRate,
    monthlyIncome: income,
    monthlyExpense: nonInvestExpense,
    netMonthly: effectiveSavings,
    grade,
    recommendations,
  };
}

export function getOfflineAIResponse(
  query: string,
  transactions: Transaction[],
  taxResult: TaxCalculationResult
): string {
  const q = query.toLowerCase().trim();

  // 1. ThaiESG / SSF / RMF comparison
  if (q.includes('thaiesg') || q.includes('esg') || q.includes('ssf') || q.includes('rmf')) {
    return `เปรียบเทียบ 3 กองทุนลดหย่อนภาษียอดนิยม (ThaiESG vs SSF vs RMF)

1. กองทุน ThaiESG (ไฮไลต์เด่นที่สุดตอนนี้)
   • วงเงินลดหย่อน: สูงสุด 30% ของเงินได้ ไม่เกิน 300,000 บาท
   • จุดเด่นสำคัญ: แยกวงเงินต่างหาก! ไม่นับรวมกับกลุ่มเกษียณ 500,000 บาท
   • ระยะเวลาถือครอง: 5 ปีเต็ม (นับวันชนวัน) สั้นที่สุดในกลุ่มกองทุนภาษี
   • นโยบาย: ลงทุนในหุ้น/ตราสารหนี้ไทยที่โดดเด่นด้านความยั่งยืน (ESG)

2. กองทุน SSF (Super Savings Fund)
   • วงเงินลดหย่อน: สูงสุด 30% ไม่เกิน 200,000 บาท (นับรวมเพดานเกษียณ 500k)
   • ระยะเวลาถือครอง: 10 ปีเต็ม (นับวันชนวัน) เลือกลงทุนหุ้นต่างประเทศ/S&P500 ได้

3. กองทุน RMF (Retirement Mutual Fund)
   • วงเงินลดหย่อน: สูงสุด 30% ไม่เกิน 500,000 บาท (นับรวมเพดานเกษียณ 500k)
   • ระยะเวลาถือครอง: ลงทุนต่อเนื่องและถือจนอายุครบ 55 ปีบริบูรณ์ (อย่างน้อย 5 ปี)

คำแนะนำลำดับการซื้อ:
หากเน้นปลดล็อกเงินไว แนะนำเริ่มจาก ThaiESG (ถือ 5 ปี) คู่กับ RMF (หากอายุ 45+) หรือ SSF (หากต้องการลงหุ้นเติบโตต่างประเทศ)`;
  }

  // 2. 4% Rule & Inflation
  if (q.includes('4%') || q.includes('เงินเฟ้อ') || q.includes('เกษียณ') || q.includes('ถอนเงิน')) {
    return `เข้าใจ "เงินเฟ้อ" และ "กฎ 4% (Safe Withdrawal Rule)" สำหรับวัยเกษียณ

1. ทำไมต้องคิดหักเงินเฟ้อ?
   • เงินเฟ้อเฉลี่ยของไทยและโลกอยู่ที่ราว 2.5% - 3.0% ต่อปี
   • เงิน 10 ล้านบาทในอีก 25 ปีข้างหน้า ที่เงินเฟ้อ 2.5%/ปี จะมีอำนาจซื้อเทียบเท่าเงินวันนี้ราว ~5.39 ล้านบาท
   • คุณสามารถเปิดสวิตช์ "หักเงินเฟ้อ" ในแท็บวางแผนลงทุนเพื่อดูมูลค่าอำนาจซื้อจริงได้ทันที

2. กฎ 4% (4% Safe Withdrawal Rate) คืออะไร?
   • งานวิจัย Trinity Study พบว่า หากจัดพอร์ตสมดุล (หุ้น + ตราสารหนี้) แล้วถอนเงินมาใช้ปีละ 4% ของพอร์ต ณ วันเกษียณ (หรือเดือนละ 0.333%) เงินต้นจะมีโอกาสอยู่ได้ยาวนานกว่า 30 ปีโดยไม่หมด
   • สูตรคิดเร็ว: อยากใช้เงินหลังเกษียณเดือนละเท่าไหร่ ให้คูณด้วย 300 เช่น อยากใช้เดือนละ 30,000 บาท ต้องมีพอร์ต = 30,000 × 300 = 9,000,000 บาท`;
  }

  // 3. Portfolio 100,000 / Asset Allocation
  if (q.includes('100,000') || q.includes('แสน') || q.includes('จัดพอร์ต')) {
    return `คำแนะนำจัดพอร์ตเงินก้อน 100,000 บาท (กลยุทธ์ Core & Satellite)

1. เงินสำรองสภาพคล่อง (20% = 20,000 บาท)
   • ฝากบัญชีออมทรัพย์ดิจิทัลดอกเบี้ยสูง (1.5% - 2.0% ต่อปี) ถอนได้ทุกเมื่อ

2. พอร์ตหลัก Core Portfolio (55% = 55,000 บาท)
   • กองทุนดัชนีหุ้นโลก / S&P 500: 35,000 บาท (35%)
   • กองทุนตราสารหนี้คุณภาพดี / พันธบัตร: 20,000 บาท (20%)

3. พอร์ตเสริม Satellite Portfolio (25% = 25,000 บาท)
   • หุ้นกลุ่มเทคโนโลยีเติบโตสูง / เซมิคอนดักเตอร์: 15,000 บาท (15%)
   • ทองคำ / Gold ETF กันความเสี่ยงเงินเฟ้อ: 10,000 บาท (10%)

ข้อแนะนำ: แบ่งทยอยเข้าซื้อ (DCA) 3–4 งวดเพื่อเฉลี่ยต้นทุนและลดความผันผวน`;
  }

  // 4. Tax saving tips & Easy E-Receipt
  if (q.includes('ภาษี') || q.includes('ลดหย่อน') || q.includes('receipt') || q.includes('ประหยัดภาษี')) {
    const currentTax = taxResult.totalTax;
    return `เช็กลิสต์ประหยัดภาษีบุคคลธรรมดาฉบับครบเครื่อง

ภาษีที่ต้องชำระตามข้อมูลปัจจุบันของคุณ: ${formatTHB(currentTax)} (อัตราจริง ${taxResult.effectiveTaxRate.toFixed(2)}%)

1. สิทธิส่วนบุคคล & ครอบครัว
   • ส่วนตัว 60,000 บ. | คู่สมรสไม่มีเงินได้ 60,000 บ.
   • บุตรคนละ 30,000 บ. | บิดามารดาอายุ 60+ คนละ 30,000 บ. (สูงสุด 4 คน)

2. กองทุน ThaiESG (วงเงินแยก 300,000 บาท!)
   • ลดหย่อนได้สูงสุด 30% ของเงินได้ ไม่เกิน 300,000 บ. ถือครองเพียง 5 ปีเต็ม

3. กลุ่มเกษียณ PVD + SSF + RMF (รวมไม่เกิน 500,000 บาท)
   • เมื่อรวมกับ ThaiESG เท่ากับลดหย่อนผ่านกองทุนได้สูงสุดถึง 800,000 บาทต่อปี!

4. โครงการรัฐ & ความมั่นคงพื้นฐาน
   • Easy E-Receipt (ใบกำกับภาษีอิเล็กทรอนิกส์): สูงสุด 50,000 บ.
   • ประกันชีวิต + สุขภาพ: รวมไม่เกิน 100,000 บ. (สุขภาพไม่เกิน 25,000 บ.)
   • ดอกเบี้ยบ้าน/คอนโด: สูงสุด 100,000 บ. | ประกันสังคม: สูงสุด 9,000 บ.`;
  }

  // 5. Financial Health
  if (q.includes('สุขภาพ') || q.includes('วิเคราะห์') || q.includes('สถานะ') || q.includes('การเงิน')) {
    const health = evaluateFinancialHealth(transactions, taxResult);
    return `รายงานตรวจสุขภาพการเงินของคุณ (วิเคราะห์จากเดือนล่าสุด)

• คะแนนสุขภาพการเงิน: ${health.score}/100 คะแนน (${health.grade})
• รายรับเดือนล่าสุด: ${formatTHB(health.monthlyIncome)}
• รายจ่ายใช้สอยจริง: ${formatTHB(health.monthlyExpense)}
• เงินออมและลงทุนรวม: ${formatTHB(health.netMonthly)} (${health.savingsRate.toFixed(1)}% ของรายได้)

ข้อเสนอแนะเฉพาะคุณ:
${health.recommendations.join('\n')}`;
  }

  // 6. Stocks / Global investing
  if (q.includes('หุ้น') || q.includes('ต่างประเทศ') || q.includes('s&p')) {
    return `แนวทางการลงทุนในหุ้นโลกและ S&P 500 สำหรับนักลงทุนไทย

1. ดัชนีหลักที่ควรมีติดพอร์ต
   • S&P 500 (500 บริษัทชั้นนำสหรัฐฯ) หรือ MSCI World (หุ้นประเทศพัฒนาแล้วทั่วโลก)

2. ลงทุนช่องทางไหนประหยัดภาษีที่สุด?
   • ลงทุนผ่านกองทุนรวมต่างประเทศในไทย (FIF) หรือ DR / DRx บนกระดานหุ้นไทย จะได้รับยกเว้นภาษี Capital Gains เมื่อขายทำกำไร
   • หากต้องการลดหย่อนภาษีควบคู่กัน สามารถซื้อผ่านกองทุน SSF หรือ RMF ที่มีนโยบายลงทุนในดัชนี S&P 500 ได้เลย`;
  }

  // 7. Emergency Fund / 50-30-20
  if (q.includes('ฉุกเฉิน') || q.includes('50/30/20') || q.includes('งบ')) {
    return `การจัดงบตามกฎ 50/30/20 และเงินสำรองฉุกเฉิน

• 50% ความจำเป็น (Needs): ค่าที่พัก อาหาร น้ำไฟ เดินทาง ประกันสุขภาพ
• 30% ความสุขส่วนตัว (Wants): ช้อปปิ้ง ท่องเที่ยว บันเทิง
• 20% ออมและลงทุน (Savings): เงินสำรองฉุกเฉิน + DCA กองทุน/หุ้น

คุณสามารถกดปุ่ม "ตั้งงบรายหมวด" ในหน้ากระแสเงินสด เพื่อกำหนดเพดานรายจ่ายแต่ละหมวดและรับการแจ้งเตือนเมื่อใช้เกินงบได้ทันทีครับ`;
  }

  return `คำแนะนำทางการเงินสำหรับหัวข้อ: "${query}"

1. ตรวจสอบกระแสเงินสดรายเดือน: ใช้ตัวเลือกเดือนในแท็บ "กระแสเงินสด" เพื่อดูสัดส่วน 50/30/20 และตั้งงบจำกัดรายหมวดหมู่
2. ใช้สิทธิลดหย่อนยุคใหม่: อย่าลืมใช้สิทธิ ThaiESG (เพดานแยก 300,000 บ.) และ Easy E-Receipt ในแท็บ "ภาษี & ลดหย่อน"
3. วางแผนสู้เงินเฟ้อ: เปิดสวิตช์ "หักเงินเฟ้อ" ในแท็บ "วางแผนลงทุน" เพื่อดูเงินถอนใช้รายเดือนหลังเกษียณตามกฎ 4%

ลองพิมพ์คำถามเฉพาะเจาะจง เช่น "ThaiESG ต่างกับ RMF ยังไง" หรือ "กฎ 4% เกษียณ" ได้เลยครับ!`;
}
