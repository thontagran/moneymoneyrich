import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Pencil,
  PieChart as PieChartIcon,
  DollarSign,
  Plus,
  X,
  ShoppingBag,
  Utensils,
  Home,
  Zap,
  Briefcase,
  TrendingUp,
  CreditCard,
  ChevronRight,
  Calendar,
  Download,
} from 'lucide-react';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  CategoryBudgets,
  BudgetRuleGroup,
} from '../types';
import { formatTHB } from '../utils/thaiTax';
import { ExpenseDonutChart, ExpenseCategoryDatum } from './ExpenseDonutChart';

interface CashFlowViewProps {
  transactions: Transaction[];
  budgets: CategoryBudgets;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
  onUpdateBudgets: (budgets: CategoryBudgets) => void;
  onExportCSV: (filteredTransactions: Transaction[], suffix: string) => void;
  onNavigateToTax: (income: number) => void;
  onNavigateToInvest: (monthlySavings: number) => void;
}

export const CATEGORY_MAP: Record<
  TransactionCategory,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    bgClass: string;
    ruleGroup?: BudgetRuleGroup;
  }
> = {
  salary: { label: 'เงินเดือน', icon: <Briefcase className="w-3.5 h-3.5" />, color: '#10b981', bgClass: 'bg-emerald-500' },
  freelance: { label: 'ฟรีแลนซ์/งานเสริม', icon: <DollarSign className="w-3.5 h-3.5" />, color: '#059669', bgClass: 'bg-emerald-600' },
  business: { label: 'ธุรกิจส่วนตัว', icon: <TrendingUp className="w-3.5 h-3.5" />, color: '#34d399', bgClass: 'bg-emerald-400' },
  investment: { label: 'ลงทุน/ปันผล/DCA', icon: <TrendingUp className="w-3.5 h-3.5" />, color: '#6366f1', bgClass: 'bg-indigo-500', ruleGroup: 'savings' },
  other_income: { label: 'รายรับอื่นๆ', icon: <ArrowUpRight className="w-3.5 h-3.5" />, color: '#14b8a6', bgClass: 'bg-teal-500' },
  food: { label: 'อาหาร & เครื่องดื่ม', icon: <Utensils className="w-3.5 h-3.5" />, color: '#f97316', bgClass: 'bg-orange-500', ruleGroup: 'needs' },
  rent: { label: 'ที่พัก & ค่าเช่า', icon: <Home className="w-3.5 h-3.5" />, color: '#8b5cf6', bgClass: 'bg-violet-500', ruleGroup: 'needs' },
  transport: { label: 'การเดินทาง & น้ำมัน', icon: <CreditCard className="w-3.5 h-3.5" />, color: '#3b82f6', bgClass: 'bg-blue-500', ruleGroup: 'needs' },
  utilities: { label: 'ค่าน้ำ-ไฟ-เน็ต', icon: <Zap className="w-3.5 h-3.5" />, color: '#eab308', bgClass: 'bg-yellow-500', ruleGroup: 'needs' },
  shopping: { label: 'ช้อปปิ้ง & ไลฟ์สไตล์', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: '#ec4899', bgClass: 'bg-pink-500', ruleGroup: 'wants' },
  health: { label: 'สุขภาพ & ประกัน', icon: <CreditCard className="w-3.5 h-3.5" />, color: '#06b6d4', bgClass: 'bg-cyan-500', ruleGroup: 'needs' },
  entertainment: { label: 'บันเทิง & ท่องเที่ยว', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: '#f43f5e', bgClass: 'bg-rose-500', ruleGroup: 'wants' },
  other_expense: { label: 'รายจ่ายอื่นๆ', icon: <ArrowDownRight className="w-3.5 h-3.5" />, color: '#64748b', bgClass: 'bg-slate-500', ruleGroup: 'needs' },
};

const BUDGETABLE_CATEGORIES: TransactionCategory[] = [
  'rent',
  'food',
  'transport',
  'utilities',
  'shopping',
  'entertainment',
  'health',
  'other_expense',
];

function formatThaiMonthLabel(yyyyMm: string): string {
  const [yStr, mStr] = yyyyMm.split('-');
  const yearNum = Number(yStr);
  const monthIdx = Number(mStr) - 1;
  const thaiMonths = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ];
  if (isNaN(yearNum) || monthIdx < 0 || monthIdx > 11) return yyyyMm;
  const buddhistYearShort = String(yearNum + 543).slice(-2);
  return `${thaiMonths[monthIdx]} ${buddhistYearShort}`;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  transactions,
  budgets,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onUpdateBudgets,
  onExportCSV,
  onNavigateToTax,
  onNavigateToInvest,
}) => {
  // Available months derived from transactions + current month
  const availableMonths = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const set = new Set<string>([currentMonth]);
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const months = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort().reverse();
    return months[0] || new Date().toISOString().slice(0, 7);
  });

  // Sync selectedMonth if it no longer exists after clearing transactions
  React.useEffect(() => {
    if (selectedMonth !== 'all' && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0] || new Date().toISOString().slice(0, 7));
    }
  }, [availableMonths, selectedMonth]);

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Add / Edit Transaction Sheet state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<TransactionType>('expense');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Budget Editor Sheet state
  const [isBudgetSheetOpen, setIsBudgetSheetOpen] = useState(false);
  const [draftBudgets, setDraftBudgets] = useState<CategoryBudgets>(budgets);

  // Scoped transactions for selected month (or 'all')
  const monthScopedTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Summary metrics
  const income = useMemo(
    () =>
      monthScopedTransactions
        .filter((t) => t.type === 'income')
        .reduce((acc, c) => acc + c.amount, 0),
    [monthScopedTransactions]
  );

  const expense = useMemo(
    () =>
      monthScopedTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, c) => acc + c.amount, 0),
    [monthScopedTransactions]
  );

  const balance = income - expense;

  // Real Category-Based 50 / 30 / 20 Breakdown!
  const ruleBreakdown = useMemo(() => {
    let needsAmount = 0;
    let wantsAmount = 0;
    let investedExpenseAmount = 0;

    monthScopedTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const group = CATEGORY_MAP[t.category]?.ruleGroup || 'needs';
        if (group === 'savings') {
          investedExpenseAmount += t.amount;
        } else if (group === 'wants') {
          wantsAmount += t.amount;
        } else {
          needsAmount += t.amount;
        }
      });

    // Total savings = explicit DCA/investment transactions + unspent net positive balance
    const totalSavingsAmount = investedExpenseAmount + Math.max(0, balance);
    const denom = income > 0 ? income : Math.max(1, needsAmount + wantsAmount + totalSavingsAmount);

    const needsPct = Math.min(100, (needsAmount / denom) * 100);
    const wantsPct = Math.min(100, (wantsAmount / denom) * 100);
    const savingsPct = Math.min(100, (totalSavingsAmount / denom) * 100);

    return {
      needsAmount,
      wantsAmount,
      totalSavingsAmount,
      needsPct,
      wantsPct,
      savingsPct,
    };
  }, [monthScopedTransactions, income, balance]);

  // Filtered list for display
  const filteredList = useMemo(() => {
    return monthScopedTransactions
      .filter((t) => (filterType === 'all' ? true : t.type === filterType))
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }, [monthScopedTransactions, filterType]);

  // Expenses by category for Recharts Donut Chart
  const expenseDonutData = useMemo<ExpenseCategoryDatum[]>(() => {
    const map = new Map<TransactionCategory, { total: number; count: number }>();

    monthScopedTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const current = map.get(t.category) || { total: 0, count: 0 };
        map.set(t.category, {
          total: current.total + t.amount,
          count: current.count + 1,
        });
      });

    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([catKey, stats]) => {
        const catInfo = CATEGORY_MAP[catKey] || {
          label: catKey,
          color: '#6366f1',
          bgClass: 'bg-indigo-500',
          icon: <DollarSign className="w-3.5 h-3.5" />,
        };
        return {
          category: catKey,
          name: catInfo.label,
          value: stats.total,
          percent: expense > 0 ? (stats.total / expense) * 100 : 0,
          count: stats.count,
          color: catInfo.color,
          bgClass: catInfo.bgClass,
          icon: catInfo.icon,
        };
      });
  }, [monthScopedTransactions, expense]);

  const handleOpenAdd = (type: TransactionType) => {
    setEditingTxId(null);
    setModalType(type);
    setCategory(type === 'income' ? 'salary' : 'food');
    setDesc('');
    setAmount('');
    const defaultDate =
      selectedMonth !== 'all'
        ? `${selectedMonth}-${String(new Date().getDate()).padStart(2, '0')}`
        : new Date().toISOString().split('T')[0];
    setDate(defaultDate);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setModalType(tx.type);
    setCategory(tx.category);
    setDesc(tx.desc);
    setAmount(String(tx.amount));
    setDate(tx.date);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!desc.trim() || isNaN(val) || val <= 0) return;

    if (editingTxId !== null) {
      onUpdateTransaction({
        id: editingTxId,
        desc: desc.trim(),
        amount: val,
        type: modalType,
        category,
        date,
      });
    } else {
      onAddTransaction({
        desc: desc.trim(),
        amount: val,
        type: modalType,
        category,
        date,
      });
      if (selectedMonth !== 'all' && !date.startsWith(selectedMonth)) {
        setSelectedMonth(date.slice(0, 7));
      }
    }

    setIsModalOpen(false);
    setEditingTxId(null);
    setDesc('');
    setAmount('');
  };

  const handleOpenBudgetModal = () => {
    setDraftBudgets({ ...budgets });
    setIsBudgetSheetOpen(true);
  };

  const handleSaveBudgets = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBudgets(draftBudgets);
    setIsBudgetSheetOpen(false);
  };

  // Stacked SVG bar coordinates for 50/30/20
  const totalPctSum = Math.max(
    1,
    ruleBreakdown.needsPct + ruleBreakdown.wantsPct + ruleBreakdown.savingsPct
  );
  const wNeeds = (ruleBreakdown.needsPct / totalPctSum) * 100;
  const wWants = (ruleBreakdown.wantsPct / totalPctSum) * 100;
  const wSavings = (ruleBreakdown.savingsPct / totalPctSum) * 100;

  return (
    <div className="space-y-4 pb-16">
      {/* Month Picker Horizontal Scroller */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 pr-1 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>ช่วงเวลา:</span>
        </span>
        {availableMonths.map((m) => {
          const isActive = selectedMonth === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMonth(m)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {formatThaiMonthLabel(m)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSelectedMonth('all')}
          className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedMonth === 'all'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          ทุกเดือนรวมกัน
        </button>
      </div>

      {/* Hero Cash Flow Summary Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden border border-indigo-700/30">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-indigo-200 text-xs font-medium">
              {selectedMonth === 'all'
                ? 'กระแสเงินสดคงเหลือสะสม'
                : `คงเหลือสุทธิ (${formatThaiMonthLabel(selectedMonth)})`}
            </span>
            <span className="text-xs font-semibold text-emerald-300 tabular-nums whitespace-nowrap">
              ออม+ลงทุน {ruleBreakdown.savingsPct.toFixed(1)}%
            </span>
          </div>

          <div className="text-3xl font-extrabold tracking-tight mt-1 mb-4 text-white tabular-nums">
            {formatTHB(balance)}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>รายรับรวม</span>
              </div>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">{formatTHB(income)}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium">
                <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
                <span>รายจ่าย & ลงทุน</span>
              </div>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">{formatTHB(expense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOpenAdd('income')}
          className="min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold rounded-2xl border border-emerald-200 dark:border-emerald-800/70 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="text-xs">บันทึกรายรับ</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenAdd('expense')}
          className="min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-semibold rounded-2xl border border-rose-200 dark:border-rose-800/70 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="text-xs">บันทึกรายจ่าย</span>
        </button>
      </div>

      {/* Real Category-Driven 50/30/20 Rule Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <PieChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              สัดส่วนจริงตามกฎ 50 / 30 / 20
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
            คำนวณจากหมวดจริง
          </span>
        </div>

        {/* Pure SVG Stacked Bar */}
        <svg
          className="h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800"
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          aria-label="กราฟแท่งสัดส่วน 50 30 20"
        >
          <rect x="0" y="0" width={wNeeds} height="12" fill="#6366f1" />
          <rect x={wNeeds} y="0" width={wWants} height="12" fill="#f59e0b" />
          <rect x={wNeeds + wWants} y="0" width={wSavings} height="12" fill="#10b981" />
        </svg>

        <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 shrink-0" />
              <span className="truncate">จำเป็น (เป้า 50%)</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
              {ruleBreakdown.needsPct.toFixed(0)}% · {formatTHB(ruleBreakdown.needsAmount)}
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
              <span className="truncate">ความสุข (เป้า 30%)</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
              {ruleBreakdown.wantsPct.toFixed(0)}% · {formatTHB(ruleBreakdown.wantsAmount)}
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
              <span className="truncate">ออม/DCA (20%+)</span>
            </div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {ruleBreakdown.savingsPct.toFixed(0)}% · {formatTHB(ruleBreakdown.totalSavingsAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Expense Categories Donut Chart (Recharts) + Category Budgets */}
      <ExpenseDonutChart
        data={expenseDonutData}
        totalExpense={expense}
        budgets={budgets}
        isMonthlyScope={selectedMonth !== 'all'}
        onOpenBudgetSheet={handleOpenBudgetModal}
      />

      {/* Cross Navigation Actions */}
      <div className="bg-slate-900 dark:bg-slate-900 p-4 rounded-3xl text-white border border-slate-800 space-y-3">
        <p className="text-xs text-indigo-200 font-medium">
          ส่งต่อตัวเลขเดือนนี้ไปยังเครื่องมือวางแผน:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onNavigateToTax(income * 12)}
            className="min-h-[52px] flex items-center justify-between p-3 bg-white/10 hover:bg-white/15 rounded-2xl text-[11px] font-semibold text-white transition-colors border border-white/10 text-left cursor-pointer"
          >
            <span className="tabular-nums">
              คำนวณภาษีปีนี้
              <br />
              <span className="text-[10px] text-indigo-300 font-normal">
                รายได้ ~{formatTHB(income * 12)}/ปี
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-indigo-300 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateToInvest(Math.max(1000, ruleBreakdown.totalSavingsAmount))}
            className="min-h-[52px] flex items-center justify-between p-3 bg-white/10 hover:bg-white/15 rounded-2xl text-[11px] font-semibold text-white transition-colors border border-white/10 text-left cursor-pointer"
          >
            <span className="tabular-nums">
              วางแผนลงทุน DCA
              <br />
              <span className="text-[10px] text-indigo-300 font-normal">
                ออม ~{formatTHB(Math.max(1000, ruleBreakdown.totalSavingsAmount))}/ด.
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-indigo-300 shrink-0" />
          </button>
        </div>
      </div>

      {/* Transaction History List with Edit, Delete & CSV Export */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
              ประวัติรายการ ({filteredList.length})
            </h4>
            {filteredList.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onExportCSV(
                    filteredList,
                    selectedMonth === 'all' ? 'all' : selectedMonth
                  )
                }
                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                title="ส่งออกรายการเป็นไฟล์ CSV"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            )}
          </div>

          {/* Interactive Filter Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px]">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`min-h-[30px] px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setFilterType('income')}
              className={`min-h-[30px] px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'income'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              รายรับ
            </button>
            <button
              type="button"
              onClick={() => setFilterType('expense')}
              className={`min-h-[30px] px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'expense'
                  ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              รายจ่าย
            </button>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
            ยังไม่มีรายการในช่วงเวลานี้ กดบันทึกรายการเพื่อเริ่มต้น
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredList.map((t) => {
              const catInfo = CATEGORY_MAP[t.category] || {
                label: t.category,
                color: '#6366f1',
                bgClass: 'bg-indigo-500',
                icon: null,
              };
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 py-3 first:pt-1 last:pb-1"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${catInfo.bgClass}`}
                    >
                      {catInfo.icon || <DollarSign className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {t.desc}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 tabular-nums">
                        <span className="truncate">{catInfo.label}</span>
                        <span aria-hidden="true">·</span>
                        <span className="shrink-0">{t.date}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-xs font-bold tabular-nums mr-1 ${
                        t.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatTHB(t.amount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="แก้ไขรายการ"
                      aria-label="แก้ไขรายการ"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(t.id)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="ลบรายการ"
                      aria-label="ลบรายการ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Sheet for Adding / Editing Transaction */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                {modalType === 'income' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    {editingTxId !== null ? 'แก้ไขรายรับ' : 'เพิ่มรายรับใหม่'}
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4" />
                    {editingTxId !== null ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่ายใหม่'}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editingTxId !== null && (
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setModalType('income');
                    setCategory('salary');
                  }}
                  className={`min-h-[36px] rounded-lg transition-colors cursor-pointer ${
                    modalType === 'income'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  รายรับ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalType('expense');
                    setCategory('food');
                  }}
                  className={`min-h-[36px] rounded-lg transition-colors cursor-pointer ${
                    modalType === 'expense'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  รายจ่าย
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  รายละเอียดรายการ
                </label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={
                    modalType === 'income'
                      ? 'เช่น เงินเดือน, โบนัส, ขายของ'
                      : 'เช่น อาหารกลางวัน, ค่ารถ, ซื้อของ'
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  จำนวนเงิน (บาท)
                </label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-base text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  หมวดหมู่
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {modalType === 'income' ? (
                    <>
                      <option value="salary">เงินเดือนประจำ</option>
                      <option value="freelance">ฟรีแลนซ์ / รับจ้าง</option>
                      <option value="business">ธุรกิจส่วนตัว / ค้าขาย</option>
                      <option value="investment">เงินปันผล / ดอกเบี้ย</option>
                      <option value="other_income">รายรับอื่นๆ</option>
                    </>
                  ) : (
                    <>
                      <option value="food">อาหาร & เครื่องดื่ม (จำเป็น)</option>
                      <option value="rent">ค่าที่พัก / คอนโด / บ้าน (จำเป็น)</option>
                      <option value="transport">การเดินทาง / น้ำมัน / BTS (จำเป็น)</option>
                      <option value="utilities">ค่าน้ำ / ค่าไฟ / อินเทอร์เน็ต (จำเป็น)</option>
                      <option value="health">ประกัน & ค่ารักษาพยาบาล (จำเป็น)</option>
                      <option value="shopping">ช้อปปิ้ง & ไลฟ์สไตล์ (ความสุข)</option>
                      <option value="entertainment">ท่องเที่ยว & บันเทิง (ความสุข)</option>
                      <option value="investment">ออมเงิน / ลงทุน DCA (ออมลงทุน)</option>
                      <option value="other_expense">รายจ่ายอื่นๆ</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  วันที่ทำรายการ
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full min-h-[48px] py-3 rounded-xl text-white font-bold transition-colors cursor-pointer ${
                    modalType === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {editingTxId !== null ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Sheet for Setting Monthly Category Budgets */}
      {isBudgetSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  ตั้งงบประมาณรายจ่ายต่อเดือน
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ใส่ 0 หากไม่ต้องการจำกัดงบในหมวดนั้น
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBudgetSheetOpen(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudgets} className="flex flex-col flex-1 min-h-0 pt-3">
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {BUDGETABLE_CATEGORIES.map((catKey) => {
                  const info = CATEGORY_MAP[catKey];
                  return (
                    <div
                      key={catKey}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${info.bgClass}`}
                        >
                          {info.icon}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {info.label}
                        </span>
                      </div>

                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={draftBudgets[catKey] ?? ''}
                        onChange={(e) =>
                          setDraftBudgets((prev) => ({
                            ...prev,
                            [catKey]: Math.max(0, Number(e.target.value)),
                          }))
                        }
                        placeholder="0"
                        className="w-28 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-right font-bold text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none shrink-0"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="submit"
                  className="w-full min-h-[48px] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  บันทึกงบประมาณรายหมวด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
