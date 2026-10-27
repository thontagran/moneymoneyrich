import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sparkles,
  Target,
  RefreshCw,
  Wallet,
  Percent,
} from 'lucide-react';
import { RiskLevel, ChartDataPoint } from '../types';
import {
  PORTFOLIO_CONFIGS,
  simulateCompoundGrowth,
  findMilestones,
} from '../utils/investment';
import { formatTHB } from '../utils/thaiTax';

interface InvestmentViewProps {
  age: number;
  targetAge: number;
  capital: number;
  monthly: number;
  risk: RiskLevel;
  inflationRate: number;
  adjustInflation: boolean;
  onChangeAge: (val: number) => void;
  onChangeTargetAge: (val: number) => void;
  onChangeCapital: (val: number) => void;
  onChangeMonthly: (val: number) => void;
  onChangeRisk: (val: RiskLevel) => void;
  onChangeInflationRate: (val: number) => void;
  onToggleAdjustInflation: (val: boolean) => void;
  onRunAIAnalysis: () => Promise<string>;
}

export const InvestmentView: React.FC<InvestmentViewProps> = ({
  age,
  targetAge,
  capital,
  monthly,
  risk,
  inflationRate,
  adjustInflation,
  onChangeAge,
  onChangeTargetAge,
  onChangeCapital,
  onChangeMonthly,
  onChangeRisk,
  onChangeInflationRate,
  onToggleAdjustInflation,
  onRunAIAnalysis,
}) => {
  const [activeScrubIndex, setActiveScrubIndex] = useState<number | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const selectedConfig = PORTFOLIO_CONFIGS[risk];
  const years = Math.max(1, targetAge - age);

  // Simulation including real inflation-adjusted purchasing power & 4% withdrawal
  const simulation = useMemo(() => {
    return simulateCompoundGrowth(
      age,
      targetAge,
      capital,
      monthly,
      selectedConfig.returnRate,
      inflationRate / 100
    );
  }, [age, targetAge, capital, monthly, selectedConfig.returnRate, inflationRate]);

  const {
    points,
    totalSaved,
    finalWealth,
    profit,
    finalRealWealth,
    realTotalSaved,
    realProfit,
    monthlySafeWithdrawalNominal,
    monthlySafeWithdrawalReal,
  } = simulation;

  const displayedWealth = adjustInflation ? finalRealWealth : finalWealth;
  const displayedSaved = adjustInflation ? realTotalSaved : totalSaved;
  const displayedProfit = adjustInflation ? realProfit : profit;

  // Milestones adapt to Nominal or Real Purchasing Power
  const milestones = useMemo(
    () => findMilestones(points, adjustInflation),
    [points, adjustInflation]
  );

  const activePoint: ChartDataPoint =
    activeScrubIndex !== null && points[activeScrubIndex]
      ? points[activeScrubIndex]
      : points[points.length - 1];

  // SVG Chart coordinates
  const chartWidth = 340;
  const chartHeight = 165;
  const maxVal = Math.max(1, points[points.length - 1].balance);

  const getCoordinates = (
    p: ChartDataPoint,
    idx: number,
    key: 'balance' | 'principal' | 'realBalance'
  ) => {
    const x = (idx / (points.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (p[key] / maxVal) * (chartHeight - 22) - 10;
    return { x, y };
  };

  const nominalBalanceStr = points
    .map((p, i) => {
      const { x, y } = getCoordinates(p, i, 'balance');
      return `${x},${y}`;
    })
    .join(' ');

  const realBalanceStr = points
    .map((p, i) => {
      const { x, y } = getCoordinates(p, i, 'realBalance');
      return `${x},${y}`;
    })
    .join(' ');

  const principalPointsStr = points
    .map((p, i) => {
      const { x, y } = getCoordinates(p, i, 'principal');
      return `${x},${y}`;
    })
    .join(' ');

  const primaryLineStr = adjustInflation ? realBalanceStr : nominalBalanceStr;
  const areaPointsStr = `0,${chartHeight} ${primaryLineStr} ${chartWidth},${chartHeight}`;

  const handleTriggerAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysisResult('');
    try {
      const res = await onRunAIAnalysis();
      setAiAnalysisResult(res);
    } catch {
      setAiAnalysisResult('เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Stacked SVG bar offsets for asset allocation
  let cumulativeShare = 0;
  const allocationRects = selectedConfig.assets.map((asset) => {
    const x = cumulativeShare;
    cumulativeShare += asset.share;
    return { ...asset, x };
  });

  return (
    <div className="space-y-4 pb-16">
      {/* Wealth Goal Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white p-5 rounded-3xl shadow-lg border border-indigo-700/30 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-indigo-200 text-xs font-medium">
            {adjustInflation
              ? `อำนาจซื้อจริง ณ อายุ ${targetAge} ปี (หักเงินเฟ้อ)`
              : `มูลค่าพอร์ตคาดหวัง ณ อายุ ${targetAge} ปี (${years} ปี)`}
          </span>
          <span className="text-xs font-semibold text-indigo-200 tabular-nums whitespace-nowrap">
            ~{(selectedConfig.returnRate * 100).toFixed(1)}%/ปี
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
            {formatTHB(displayedWealth)}
          </span>
          {adjustInflation && (
            <span className="text-[11px] text-indigo-300 tabular-nums">
              (ตัวเลขก่อนหักเงินเฟ้อ {formatTHB(finalWealth)})
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl">
            <span className="text-indigo-200 text-[10px] block">
              {adjustInflation ? 'มูลค่าเงินต้น (เทียบปัจจุบัน)' : 'เงินต้นสะสมที่คุณออม'}
            </span>
            <span className="font-bold text-white text-sm mt-0.5 block tabular-nums">
              {formatTHB(displayedSaved)}
            </span>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-xs p-2.5 rounded-2xl border border-emerald-400/20">
            <span className="text-emerald-200 text-[10px] block">
              {adjustInflation ? 'กำไรสุทธิหลังหักเงินเฟ้อ' : 'ผลตอบแทนทบต้นรวม'}
            </span>
            <span className="font-bold text-emerald-300 text-sm mt-0.5 block tabular-nums">
              +{formatTHB(displayedProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* 4% Safe Withdrawal Rule Retirement Income Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>เงินถอนใช้รายเดือนหลังเกษียณ (กฎ 4% Rule)</span>
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
            อยู่ได้ 30+ ปี
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium block">
              เทียบค่าครองชีพวันนี้
            </span>
            <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5 block">
              {formatTHB(monthlySafeWithdrawalReal)}/ด.
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              หักเงินเฟ้อ {inflationRate.toFixed(1)}%/ปีแล้ว
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              ยอดเงินถอนจริง ณ อายุ {targetAge}
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
              {formatTHB(monthlySafeWithdrawalNominal)}/ด.
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              ถอน 4% ของพอร์ตต่อปี
            </span>
          </div>
        </div>
      </div>

      {/* Inflation Purchasing Power Control + Interactive Compound Chart */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>กราฟดอกเบี้ยทบต้น & อำนาจซื้อจริง</span>
          </h4>

          <button
            type="button"
            role="switch"
            aria-checked={adjustInflation}
            onClick={() => onToggleAdjustInflation(!adjustInflation)}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              adjustInflation
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Percent className="w-3 h-3" />
            <span>{adjustInflation ? `หักเงินเฟ้อ ${inflationRate}%` : 'คิดหักเงินเฟ้อ'}</span>
          </button>
        </div>

        {/* Inflation Rate Slider when active */}
        {adjustInflation && (
          <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/60 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-teal-900 dark:text-teal-300 font-semibold">
              <span>สมมติฐานเงินเฟ้อเฉลี่ยต่อปี</span>
              <span className="tabular-nums">{inflationRate.toFixed(1)}% / ปี</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="0.5"
              value={inflationRate}
              onChange={(e) => onChangeInflationRate(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>
        )}

        {/* Scrubbing Info Box */}
        <div className="bg-indigo-50/70 dark:bg-slate-800/80 p-3 rounded-2xl border border-indigo-100 dark:border-slate-700 flex items-center justify-between text-xs tabular-nums">
          <div>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
              ปีที่ {activePoint.year} · อายุ {activePoint.age} ปี
            </p>
            <p className="text-base font-extrabold text-indigo-950 dark:text-white mt-0.5">
              {formatTHB(adjustInflation ? activePoint.realBalance : activePoint.balance)}
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
            {adjustInflation ? (
              <>
                <p>
                  ตัวเลขอนาคต:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {formatTHB(activePoint.balance)}
                  </strong>
                </p>
                <p>
                  กำไรจริง:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    +{formatTHB(activePoint.realInterest)}
                  </strong>
                </p>
              </>
            ) : (
              <>
                <p>
                  เงินต้น:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {formatTHB(activePoint.principal)}
                  </strong>
                </p>
                <p>
                  กำไรสะสม:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    +{formatTHB(activePoint.interest)}
                  </strong>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Interactive SVG Curve */}
        <div className="relative w-full pt-2">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-44 overflow-visible touch-none cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              const idx = Math.round(ratio * (points.length - 1));
              setActiveScrubIndex(idx);
            }}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={adjustInflation ? '#0d9488' : '#4f46e5'}
                  stopOpacity="0.28"
                />
                <stop
                  offset="100%"
                  stopColor={adjustInflation ? '#0d9488' : '#4f46e5'}
                  stopOpacity="0.0"
                />
              </linearGradient>
            </defs>

            <line
              x1="0"
              y1={chartHeight - 10}
              x2={chartWidth}
              y2={chartHeight - 10}
              stroke="#94a3b8"
              strokeOpacity="0.2"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1={chartHeight / 2}
              x2={chartWidth}
              y2={chartHeight / 2}
              stroke="#94a3b8"
              strokeOpacity="0.2"
              strokeWidth="1"
              strokeDasharray="3,3"
            />

            <polygon points={areaPointsStr} fill="url(#areaGradient)" />

            {/* Principal Line */}
            <polyline
              points={principalPointsStr}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4,4"
            />

            {/* Reference Nominal Line when Inflation is ON */}
            {adjustInflation && (
              <polyline
                points={nominalBalanceStr}
                fill="none"
                stroke="#6366f1"
                strokeOpacity="0.35"
                strokeWidth="2"
                strokeDasharray="3,3"
              />
            )}

            {/* Primary Wealth Curve */}
            <polyline
              points={primaryLineStr}
              fill="none"
              stroke={adjustInflation ? '#0d9488' : '#4f46e5'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Scrub Marker */}
            {(() => {
              const idx = activeScrubIndex !== null ? activeScrubIndex : points.length - 1;
              const { x, y } = getCoordinates(
                points[idx],
                idx,
                adjustInflation ? 'realBalance' : 'balance'
              );
              return (
                <g>
                  <line
                    x1={x}
                    y1="0"
                    x2={x}
                    y2={chartHeight}
                    stroke={adjustInflation ? '#0d9488' : '#6366f1'}
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill={adjustInflation ? '#0d9488' : '#4f46e5'}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              );
            })()}
          </svg>

          <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 pt-1 tabular-nums">
            <span>อายุ {age} ปี</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span
                  className={`w-2.5 h-0.5 ${
                    adjustInflation ? 'bg-teal-600' : 'bg-indigo-600'
                  }`}
                />
                <span>{adjustInflation ? 'มูลค่าจริง' : 'พอร์ตรวม'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-slate-400" />
                <span>เงินต้น</span>
              </span>
            </div>
            <span>อายุ {targetAge} ปี</span>
          </div>
        </div>
      </div>

      {/* Target & Saving Parameters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 transition-colors">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
          ตั้งค่าเป้าหมายและแผนการออม
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-medium mb-1">
              <span>อายุปัจจุบัน</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
                {age} ปี
              </strong>
            </div>
            <input
              type="range"
              min="18"
              max="70"
              value={age}
              onChange={(e) => {
                const val = Number(e.target.value);
                onChangeAge(val);
                if (val >= targetAge) onChangeTargetAge(val + 1);
              }}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-medium mb-1">
              <span>อายุเป้าหมาย</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
                {targetAge} ปี
              </strong>
            </div>
            <input
              type="range"
              min={age + 1}
              max="90"
              value={targetAge}
              onChange={(e) => onChangeTargetAge(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              เงินต้นเริ่มต้นที่มีอยู่ (บาท)
            </label>
            <input
              type="number"
              value={capital || ''}
              onChange={(e) => onChangeCapital(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
              <span>เงินลงทุนออมรายเดือน DCA (บาท/เดือน)</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
                {formatTHB(monthly)}/ด.
              </span>
            </div>
            <input
              type="number"
              value={monthly || ''}
              onChange={(e) => onChangeMonthly(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={Math.min(100000, monthly)}
              onChange={(e) => onChangeMonthly(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex flex-wrap gap-1.5">
              {[0, 3000, 5000, 10000, 20000, 50000].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeMonthly(m)}
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                    monthly === m
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {m >= 1000 ? `${m / 1000}k` : '0'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Profile & Asset Allocation */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 transition-colors">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
          กลยุทธ์การจัดพอร์ตตามความเสี่ยง (Asset Allocation)
        </h4>

        <div className="grid grid-cols-3 gap-1.5">
          {(['low', 'medium', 'high'] as RiskLevel[]).map((r) => {
            const isSel = risk === r;
            const cfg = PORTFOLIO_CONFIGS[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => onChangeRisk(r)}
                className={`min-h-[52px] p-2.5 rounded-2xl border text-center transition-colors cursor-pointer ${
                  isSel
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-500 text-indigo-950 dark:text-white font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[11px] block whitespace-nowrap">
                  {r === 'low' ? 'เสี่ยงต่ำ' : r === 'medium' ? 'เสี่ยงกลาง' : 'เสี่ยงสูง'}
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 block tabular-nums">
                  ~{(cfg.returnRate * 100).toFixed(1)}%/ปี
                </span>
              </button>
            );
          })}
        </div>

        {/* Pure SVG Stacked Allocation Bar */}
        <div className="space-y-2.5 pt-2">
          <svg
            className="h-3.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800"
            viewBox="0 0 100 14"
            preserveAspectRatio="none"
            aria-label="สัดส่วนการจัดพอร์ต"
          >
            {allocationRects.map((asset, idx) => (
              <rect
                key={idx}
                x={asset.x}
                y="0"
                width={asset.share}
                height="14"
                fill={asset.color}
              />
            ))}
          </svg>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            {selectedConfig.assets.map((asset, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2"
              >
                <span className={`w-2.5 h-2.5 rounded-sm mt-1 shrink-0 ${asset.bgClass}`} />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-[11px] tabular-nums">
                    {asset.name} ({asset.share}%)
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    {asset.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wealth Milestones Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>หมุดหมายความมั่งคั่ง</span>
          </h4>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {adjustInflation ? 'คิดตามอำนาจซื้อวันนี้' : 'คิดตามมูลค่าอนาคต'}
          </span>
        </div>

        <div className="space-y-2 text-xs tabular-nums">
          {milestones.map((m, idx) => {
            const isReached = m.achievedAge !== null;
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-2xl flex items-center justify-between border transition-opacity ${
                  isReached
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isReached
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isReached ? '✓' : idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-[11px] block">
                      {m.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {formatTHB(m.targetAmount)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {isReached ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                      อายุ {m.achievedAge} ปี (ใน {m.yearsNeeded} ปี)
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">ยังไม่ถึงใน {years} ปีนี้</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Plan Evaluation Section */}
      <div className="bg-indigo-50/70 dark:bg-slate-900 p-4 rounded-3xl border border-indigo-100 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>ประเมินความมั่งคั่ง & แผนถอนเงิน</span>
          </div>
          <button
            type="button"
            onClick={handleTriggerAnalysis}
            disabled={isAnalyzing}
            className="min-h-[38px] px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังประมวลผล...</span>
              </>
            ) : (
              <span>วิเคราะห์แผนนี้</span>
            )}
          </button>
        </div>

        {aiAnalysisResult ? (
          <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-2xl border border-indigo-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
            {aiAnalysisResult}
          </div>
        ) : !isAnalyzing ? (
          <p className="text-[11px] text-indigo-700 dark:text-slate-400">
            แตะปุ่ม "วิเคราะห์แผนนี้" เพื่อรับบทสรุปความเป็นไปได้ อำนาจซื้อหลังหักเงินเฟ้อ และเงินใช้รายเดือนวัยเกษียณ
          </p>
        ) : null}
      </div>
    </div>
  );
};
