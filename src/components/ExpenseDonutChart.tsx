import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  PieChart as PieChartIcon,
  RotateCcw,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';
import { TransactionCategory, CategoryBudgets } from '../types';
import { formatTHB } from '../utils/thaiTax';

export interface ExpenseCategoryDatum {
  category: TransactionCategory;
  name: string;
  value: number;
  percent: number;
  count: number;
  color: string;
  bgClass: string;
  icon: React.ReactNode;
}

interface ExpenseDonutChartProps {
  data: ExpenseCategoryDatum[];
  totalExpense: number;
  budgets?: CategoryBudgets;
  isMonthlyScope?: boolean;
  onOpenBudgetSheet?: () => void;
}

interface CustomTooltipPayloadItem {
  payload?: ExpenseCategoryDatum;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
}

const CustomDonutTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white px-3 py-2 rounded-xl shadow-lg text-xs pointer-events-none border border-slate-700/60">
      <p className="font-semibold text-white whitespace-nowrap">{item.name}</p>
      <p className="text-slate-200 mt-0.5 tabular-nums whitespace-nowrap">
        {formatTHB(item.value)} · {item.percent.toFixed(1)}% ({item.count} รายการ)
      </p>
    </div>
  );
};

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({
  data,
  totalExpense,
  budgets = {},
  isMonthlyScope = true,
  onOpenBudgetSheet,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);

  const activeItem = selectedCategory
    ? data.find((d) => d.category === selectedCategory) ?? null
    : null;

  const handleToggleCategory = (cat: TransactionCategory) => {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
  };

  const hasExpenses = data.length > 0 && totalExpense > 0;
  const emptyPlaceholderData = [{ name: 'ไม่มีรายจ่าย', value: 1 }];

  return (
    <section className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <PieChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
            สัดส่วนหมวดหมู่รายจ่าย
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {activeItem && (
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="min-h-[36px] px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ดูรวม</span>
            </button>
          )}

          {onOpenBudgetSheet && (
            <button
              type="button"
              onClick={onOpenBudgetSheet}
              className="min-h-[36px] px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>ตั้งงบรายหมวด</span>
            </button>
          )}
        </div>
      </div>

      {!hasExpenses ? (
        /* Empty State */
        <div className="py-4 flex flex-col items-center text-center space-y-2">
          <div className="relative h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emptyPlaceholderData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  stroke="none"
                  isAnimationActive={false}
                >
                  <Cell fill="#94a3b8" fillOpacity={0.25} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-slate-400 font-medium">รายจ่ายรวม</span>
              <span className="text-sm font-bold text-slate-400 tabular-nums">฿0</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px]">
            ยังไม่มีรายการรายจ่ายในช่วงเวลานี้ กดปุ่มบันทึกรายจ่ายด้านบนเพื่อดูสัดส่วนกราฟโดนัท
          </p>
        </div>
      ) : (
        <>
          {/* Interactive Recharts Donut Chart */}
          <div className="relative h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={92}
                  paddingAngle={data.length > 1 ? 3 : 0}
                  cornerRadius={6}
                  stroke="none"
                  isAnimationActive={true}
                  animationDuration={400}
                >
                  {data.map((entry) => {
                    const isDimmed =
                      selectedCategory !== null && selectedCategory !== entry.category;
                    return (
                      <Cell
                        key={entry.category}
                        fill={entry.color}
                        fillOpacity={isDimmed ? 0.25 : 1}
                        className="cursor-pointer transition-opacity duration-200 outline-none"
                        onClick={() => handleToggleCategory(entry.category)}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomDonutTooltip />} offset={14} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Donut Summary Readout */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-10">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[116px]">
                {activeItem ? activeItem.name : 'รายจ่ายรวม'}
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums mt-0.5">
                {formatTHB(activeItem ? activeItem.value : totalExpense)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                {activeItem
                  ? `${activeItem.percent.toFixed(1)}% · ${activeItem.count} รายการ`
                  : 'แตะส่วนโค้งเพื่อดูรายหมวด'}
              </span>
            </div>
          </div>

          {/* Interactive Category Legend, Share & Monthly Budget Status */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border-t border-slate-100 dark:border-slate-800 pt-1">
            {data.map((item) => {
              const isSelected = selectedCategory === item.category;
              const isDimmed = selectedCategory !== null && !isSelected;
              const budgetLimit =
                isMonthlyScope && item.category !== 'investment'
                  ? budgets[item.category] || 0
                  : 0;
              const isOverBudget = budgetLimit > 0 && item.value > budgetLimit;
              const budgetRatio =
                budgetLimit > 0 ? Math.min(100, (item.value / budgetLimit) * 100) : item.percent;

              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => handleToggleCategory(item.category)}
                  aria-pressed={isSelected}
                  className={`w-full min-h-[54px] py-2.5 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 text-left transition-opacity duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/70'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                  } ${isDimmed ? 'opacity-45' : 'opacity-100'}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${item.bgClass}`}
                    >
                      {item.icon}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap shrink-0">
                          {formatTHB(item.value)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg
                          className="h-1.5 flex-1 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                          viewBox="0 0 100 6"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <rect
                            x="0"
                            y="0"
                            width={Math.max(2, Math.min(100, budgetLimit > 0 ? budgetRatio : item.percent))}
                            height="6"
                            rx="3"
                            fill={isOverBudget ? '#e11d48' : item.color}
                          />
                        </svg>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                          {item.percent.toFixed(1)}%
                        </span>
                      </div>

                      {budgetLimit > 0 && (
                        <div className="flex items-center justify-between text-[10px] tabular-nums">
                          {isOverBudget ? (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>
                                เกินงบ +{formatTHB(item.value - budgetLimit)} (งบ {formatTHB(budgetLimit)})
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">
                              งบเดือนนี้ {formatTHB(budgetLimit)} · คงเหลือ {formatTHB(budgetLimit - item.value)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
