import React, { useState } from 'react';
import {
  Calculator,
  Sparkles,
  Layers,
  Award,
  Check,
  Users,
  Leaf,
  Receipt,
  Minus,
  Plus,
} from 'lucide-react';
import { TaxDeductions, IncomeSectionType, TaxCalculationResult } from '../types';
import {
  INCOME_SECTIONS,
  computeProgressiveTax,
  formatTHB,
  formatNumber,
} from '../utils/thaiTax';

interface TaxViewProps {
  annualIncome: number;
  incomeType: IncomeSectionType;
  deductions: TaxDeductions;
  taxResult: TaxCalculationResult;
  onChangeIncome: (val: number) => void;
  onChangeIncomeType: (val: IncomeSectionType) => void;
  onChangeDeductions: <K extends keyof TaxDeductions>(field: K, val: TaxDeductions[K]) => void;
  onClearTaxInputs?: () => void;
}

export const TaxView: React.FC<TaxViewProps> = ({
  annualIncome,
  incomeType,
  deductions,
  taxResult,
  onChangeIncome,
  onChangeIncomeType,
  onChangeDeductions,
  onClearTaxInputs,
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'ladder' | 'tips'>('calculator');

  const presets = [360000, 600000, 900000, 1200000, 2000000];

  // Tax without voluntary deductions (only statutory expense + 60,000 personal allowance)
  const baseNetWithoutDeductions = Math.max(0, annualIncome - taxResult.expensesAllowed - 60000);
  const taxWithoutExtraDeductions = computeProgressiveTax(baseNetWithoutDeductions);
  const taxSaved = Math.max(0, taxWithoutExtraDeductions - taxResult.totalTax);

  // Highest active marginal bracket
  const highestBracket =
    taxResult.taxDetails.filter((t) => t.isActive).pop() || taxResult.taxDetails[0];

  // Remaining quotas for Tips tab
  const maxThaiEsg = Math.min(annualIncome * 0.3, 300000);
  const remainingThaiEsg = Math.max(0, maxThaiEsg - (deductions.thaiEsg || 0));

  const remainingEasyReceipt = Math.max(0, 50000 - (deductions.easyEReceipt || 0));

  const usedRetirement =
    Math.min(deductions.providentFund || 0, annualIncome * 0.15, 500000) +
    Math.min(deductions.ssf || 0, annualIncome * 0.3, 200000) +
    Math.min(deductions.rmf || 0, annualIncome * 0.3, 500000);
  const remainingRetirementPool = Math.max(0, 500000 - usedRetirement);
  const maxRMFAllowed = Math.min(annualIncome * 0.3, 500000);
  const remainingRMF = Math.min(
    remainingRetirementPool,
    Math.max(0, maxRMFAllowed - (deductions.rmf || 0))
  );

  const usedIns = (deductions.lifeIns || 0) + Math.min(deductions.healthIns || 0, 25000);
  const remainingIns = Math.max(0, 100000 - usedIns);

  return (
    <div className="space-y-4 pb-16">
      {/* Sub-navigation Segmented Control */}
      <div className="grid grid-cols-3 gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-2xl text-xs font-semibold border border-transparent dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`min-h-[40px] py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'calculator'
              ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 shrink-0" />
          <span>คำนวณภาษี</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ladder')}
          className={`min-h-[40px] py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'ladder'
              ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>ขั้นบันได</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tips')}
          className={`min-h-[40px] py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'tips'
              ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>สิทธิคงเหลือ</span>
        </button>
      </div>

      {/* Tax Summary Hero Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-indigo-700/30">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-indigo-200 text-xs font-medium">ภาษีที่ต้องชำระทั้งปี</span>
            <span className="text-xs font-semibold text-indigo-200 tabular-nums whitespace-nowrap">
              ฐานสูงสุด {highestBracket.rateText}
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
            {formatTHB(taxResult.totalTax)}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-xs">
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl">
              <span className="text-indigo-200 text-[10px] block">อัตราภาษีแท้จริง (Effective)</span>
              <span className="font-bold text-white text-sm mt-0.5 block tabular-nums">
                {taxResult.effectiveTaxRate.toFixed(2)}%
              </span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-xs p-2.5 rounded-2xl border border-emerald-400/20">
              <span className="text-emerald-200 text-[10px] block">ประหยัดภาษีได้แล้ว</span>
              <span className="font-bold text-emerald-300 text-sm mt-0.5 block tabular-nums">
                +{formatTHB(taxSaved)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'calculator' && (
        <div className="space-y-4">
          {/* 1. Annual Income Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                01. รายได้พึงประเมินทั้งปี (บาท)
              </h4>
              {onClearTaxInputs ? (
                <button
                  type="button"
                  onClick={onClearTaxInputs}
                  className="min-h-[30px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  ล้างค่าภาษีเป็น 0
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  รวมโบนัส/งานเสริม
                </span>
              )}
            </div>

            <input
              type="number"
              value={annualIncome || ''}
              onChange={(e) => onChangeIncome(Math.max(0, Number(e.target.value)))}
              placeholder="กรอกรายได้ต่อปี เช่น 600000"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-lg text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />

            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChangeIncome(p)}
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                    annualIncome === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p >= 1000000 ? `${p / 1000000} ล้าน` : `${p / 1000}k`}
                </button>
              ))}
            </div>

            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ประเภทเงินได้ (มาตรา 40)
              </label>
              <select
                value={incomeType}
                onChange={(e) => onChangeIncomeType(e.target.value as IncomeSectionType)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {INCOME_SECTIONS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between px-1 tabular-nums">
                <span>หักค่าใช้จ่ายเหมาตามกฎหมาย</span>
                <strong className="text-indigo-600 dark:text-indigo-400">
                  -{formatTHB(taxResult.expensesAllowed)}
                </strong>
              </div>
            </div>
          </div>

          {/* 2. Family & Personal Deductions Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs transition-colors">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>02. สิทธิส่วนบุคคล & ครอบครัว</span>
              </h4>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatTHB(
                  taxResult.bracketTaxSummary.personal + taxResult.bracketTaxSummary.family
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>ลดหย่อนส่วนตัว (อัตโนมัติ)</span>
              </span>
              <strong className="text-slate-900 dark:text-white tabular-nums">60,000 บ.</strong>
            </div>

            {/* Spouse Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">คู่สมรส (ไม่มีเงินได้)</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">ลดหย่อนเพิ่ม 60,000 บาท</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={deductions.spouse}
                onClick={() => onChangeDeductions('spouse', !deductions.spouse)}
                className={`min-h-[36px] px-3.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
                  deductions.spouse
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {deductions.spouse ? 'ใช้สิทธิ (60k)' : 'ไม่ใช้สิทธิ'}
              </button>
            </div>

            {/* Children & Parents Steppers */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-slate-700 dark:text-slate-200">บุตร</span>
                  <span className="text-[10px] text-slate-400">30k/คน</span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      onChangeDeductions('childrenCount', Math.max(0, (deductions.childrenCount || 0) - 1))
                    }
                    className="min-h-[36px] min-w-[36px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                    aria-label="ลดจำนวนบุตร"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                    {deductions.childrenCount || 0} คน
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeDeductions('childrenCount', Math.min(10, (deductions.childrenCount || 0) + 1))
                    }
                    className="min-h-[36px] min-w-[36px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                    aria-label="เพิ่มจำนวนบุตร"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-slate-700 dark:text-slate-200">บิดามารดา</span>
                  <span className="text-[10px] text-slate-400">สูงสุด 4 คน</span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      onChangeDeductions('parentsCount', Math.max(0, (deductions.parentsCount || 0) - 1))
                    }
                    className="min-h-[36px] min-w-[36px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                    aria-label="ลดจำนวนบิดามารดา"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                    {deductions.parentsCount || 0} คน
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeDeductions('parentsCount', Math.min(4, (deductions.parentsCount || 0) + 1))
                    }
                    className="min-h-[36px] min-w-[36px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                    aria-label="เพิ่มจำนวนบิดามารดา"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ThaiESG & Retirement Funds & Insurance Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs transition-colors">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white">
                03. กองทุนลดหย่อน ประกัน & โครงการรัฐ
              </h4>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                รวม {formatTHB(taxResult.deductionsAllowed)}
              </span>
            </div>

            {/* ThaiESG Highlight Box */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>กองทุน ThaiESG (ถือ 5 ปี)</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium tabular-nums">
                  วงเงินแยก! สูงสุด {formatNumber(maxThaiEsg)} บ.
                </span>
              </div>
              <input
                type="number"
                value={deductions.thaiEsg || ''}
                onChange={(e) => onChangeDeductions('thaiEsg', Math.max(0, Number(e.target.value)))}
                placeholder="สูงสุด 30% ไม่เกิน 300,000"
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/70 rounded-xl font-bold text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Easy E-Receipt */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="font-medium flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>โครงการ Easy E-Receipt (ช้อปลดหย่อน)</span>
                </span>
                <span className="text-slate-400 text-[10px] tabular-nums">สูงสุด 50,000 บ.</span>
              </div>
              <input
                type="number"
                value={deductions.easyEReceipt || ''}
                onChange={(e) =>
                  onChangeDeductions('easyEReceipt', Math.max(0, Number(e.target.value)))
                }
                placeholder="สูงสุด 50,000"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Retirement Cluster (500k cap) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  กลุ่มเกษียณ PVD / SSF / RMF
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                  หักได้ {formatNumber(taxResult.bracketTaxSummary.retirement)} / 500,000 บ.
                </span>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                  <span>กองทุนสำรองเลี้ยงชีพ (PVD) / กบข.</span>
                  <span className="text-slate-400 text-[10px]">สูงสุด 15%</span>
                </div>
                <input
                  type="number"
                  value={deductions.providentFund || ''}
                  onChange={(e) =>
                    onChangeDeductions('providentFund', Math.max(0, Number(e.target.value)))
                  }
                  placeholder="สูงสุด 15% ของเงินเดือน"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                    <span>กองทุน SSF</span>
                    <span className="text-slate-400 text-[10px]">max 200k</span>
                  </div>
                  <input
                    type="number"
                    value={deductions.ssf || ''}
                    onChange={(e) =>
                      onChangeDeductions('ssf', Math.max(0, Number(e.target.value)))
                    }
                    placeholder="สูงสุด 200,000"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                    <span>กองทุน RMF</span>
                    <span className="text-slate-400 text-[10px]">max 500k</span>
                  </div>
                  <input
                    type="number"
                    value={deductions.rmf || ''}
                    onChange={(e) =>
                      onChangeDeductions('rmf', Math.max(0, Number(e.target.value)))
                    }
                    placeholder="สูงสุด 500,000"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Insurance & Social Sec & Home */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                    <span>ประกันชีวิต</span>
                    <span className="text-slate-400 text-[10px]">max 100k</span>
                  </div>
                  <input
                    type="number"
                    value={deductions.lifeIns || ''}
                    onChange={(e) =>
                      onChangeDeductions('lifeIns', Math.max(0, Number(e.target.value)))
                    }
                    placeholder="สูงสุด 100,000"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                    <span>ประกันสุขภาพ</span>
                    <span className="text-slate-400 text-[10px]">max 25k</span>
                  </div>
                  <input
                    type="number"
                    value={deductions.healthIns || ''}
                    onChange={(e) =>
                      onChangeDeductions('healthIns', Math.max(0, Number(e.target.value)))
                    }
                    placeholder="สูงสุด 25,000"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                    <span>ประกันสังคม</span>
                    <span className="text-slate-400 text-[10px]">max 9,000</span>
                  </div>
                  <input
                    type="number"
                    value={deductions.socialSec || ''}
                    onChange={(e) =>
                      onChangeDeductions('socialSec', Math.max(0, Number(e.target.value)))
                    }
                    placeholder="9000"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                    <span>ดอกเบี้ยบ้าน</span>
                    <span className="text-slate-400 text-[10px]">max 100k</span>
                  </div>
                  <input
                    type="number"
                    value={deductions.homeInterest || ''}
                    onChange={(e) =>
                      onChangeDeductions('homeInterest', Math.max(0, Number(e.target.value)))
                    }
                    placeholder="สูงสุด 100,000"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                  <span>เงินบริจาค / ลดหย่อนอื่นๆ</span>
                  <span className="text-slate-400 text-[10px]">ตามจ่ายจริง</span>
                </div>
                <input
                  type="number"
                  value={deductions.other || ''}
                  onChange={(e) =>
                    onChangeDeductions('other', Math.max(0, Number(e.target.value)))
                  }
                  placeholder="0"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Net Taxable Income Summary */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs tabular-nums transition-colors">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">
              สรุปโครงสร้างเงินได้สุทธิ
            </h4>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>รายได้พึงประเมินรวม</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatTHB(annualIncome)}
              </span>
            </div>
            <div className="flex justify-between text-rose-600 dark:text-rose-400">
              <span>หักค่าใช้จ่ายตามมาตรา</span>
              <span className="font-semibold">-{formatTHB(taxResult.expensesAllowed)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>หักค่าลดหย่อนรวมทั้งหมด</span>
              <span className="font-semibold">-{formatTHB(taxResult.deductionsAllowed)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              <span>เงินได้สุทธินำไปคำนวณภาษี</span>
              <span>{formatTHB(taxResult.netIncome)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: 8-Step Progressive Tax Ladder */}
      {activeTab === 'ladder' && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 transition-colors">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              ขั้นบันไดภาษีเงินได้บุคคลธรรมดา (8 ขั้น)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              เงินได้สุทธิของคุณ:{' '}
              <strong className="text-indigo-600 dark:text-indigo-400">
                {formatTHB(taxResult.netIncome)}
              </strong>
            </p>
          </div>

          <div className="space-y-2.5">
            {taxResult.taxDetails.map((b) => {
              const maxLabel = b.max === Infinity ? 'ขึ้นไป' : formatNumber(b.max);
              const minLabel = formatNumber(b.min);
              const isZeroRate = b.rate === 0;
              const fillPct = b.isFilled
                ? 100
                : b.isActive && b.max !== Infinity
                ? Math.min(100, Math.max(5, (b.taxableAmount / (b.max - b.min)) * 100))
                : b.isActive
                ? 100
                : 0;

              return (
                <div
                  key={b.bracketIndex}
                  className={`p-3 rounded-2xl border transition-opacity tabular-nums ${
                    b.isActive
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/70'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-55'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          isZeroRate
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {b.rateText}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {minLabel} – {maxLabel} บ.
                      </span>
                    </div>

                    <span className="font-bold text-slate-900 dark:text-white">
                      {b.isActive ? formatTHB(b.taxInBracket) : '฿0'}
                    </span>
                  </div>

                  <svg
                    className="h-2 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800"
                    viewBox="0 0 100 8"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="0"
                      y="0"
                      width={fillPct}
                      height="8"
                      rx="4"
                      fill={isZeroRate ? '#10b981' : '#4f46e5'}
                    />
                  </svg>

                  {b.isActive && (
                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      <span>เงินได้ในขั้นนี้: {formatTHB(b.taxableAmount)}</span>
                      <span>{b.isFilled ? 'เต็มขั้น' : 'ขั้นสูงสุดของคุณ'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Remaining Quota & Tax Saving Simulator */}
      {activeTab === 'tips' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-3xl shadow-sm">
            <h4 className="font-bold text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 shrink-0" />
              <span>ตัวคูณประหยัดภาษีของคุณ ({highestBracket.rateText})</span>
            </h4>
            <p className="text-xs text-amber-50 mt-1 leading-relaxed tabular-nums">
              ทุกๆ 10,000 บาท ที่ลดหย่อนเพิ่มในฐานภาษีปัจจุบัน จะช่วยประหยัดภาษีได้ทันที{' '}
              <strong>{formatTHB(10000 * highestBracket.rate)}</strong>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs transition-colors">
            <h5 className="font-bold text-slate-900 dark:text-white">
              สิทธิลดหย่อนที่ยังใช้ได้เพิ่ม (แตะเพื่อจำลองเต็มเพดาน):
            </h5>

            {/* ThaiESG Quota */}
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">
                  กองทุน ThaiESG (ถือ 5 ปี)
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  เหลือสิทธิ {formatTHB(remainingThaiEsg)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                วงเงินแยก 300,000 บาท หากเติมเต็มสิทธิจะช่วยลดภาษีได้สูงสุดราว{' '}
                <strong className="tabular-nums">
                  {formatTHB(remainingThaiEsg * highestBracket.rate)}
                </strong>
              </p>
              {remainingThaiEsg > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeDeductions('thaiEsg', Math.round(maxThaiEsg))}
                  className="min-h-[36px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  จำลองซื้อ ThaiESG เต็มสิทธิ ({formatTHB(maxThaiEsg)})
                </button>
              )}
            </div>

            {/* Easy E-Receipt Quota */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  Easy E-Receipt (สูงสุด 50,000 บ.)
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  เหลือสิทธิ {formatTHB(remainingEasyReceipt)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ซื้อสินค้า/บริการและขอใบกำกับภาษีอิเล็กทรอนิกส์ e-Tax Invoice
              </p>
              {remainingEasyReceipt > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeDeductions('easyEReceipt', 50000)}
                  className="min-h-[36px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  จำลองใช้สิทธิครบ 50,000 บ.
                </button>
              )}
            </div>

            {/* RMF / Retirement Quota */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  กลุ่มเกษียณ (RMF / SSF / PVD)
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  เหลือวงเงินรวม {formatTHB(remainingRMF)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                เพดานกลุ่มเกษียณรวมกันไม่เกิน 500,000 บาท (ไม่เกิน 30% ของรายได้)
              </p>
            </div>

            {/* Life & Health Insurance Quota */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  ประกันชีวิต & ประกันสุขภาพ
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  เหลือสิทธิ {formatTHB(remainingIns)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                คุ้มครองความเสี่ยงค่ารักษาพยาบาลพร้อมลดหย่อนรวมสูงสุด 100,000 บาท
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
