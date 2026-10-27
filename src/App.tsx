import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  IncomeSectionType,
  TaxDeductions,
  RiskLevel,
  ChatMessage,
  CategoryBudgets,
  BackupPayload,
} from './types';
import {
  loadStoredTransactions,
  saveStoredTransactions,
  loadStoredBudgets,
  saveStoredBudgets,
  loadStoredTaxState,
  saveStoredTaxState,
  loadStoredInvestState,
  saveStoredInvestState,
  loadStoredChat,
  saveStoredChat,
  loadStoredDarkMode,
  saveStoredDarkMode,
  getInitialChatMessages,
  exportTransactionsToCSV,
  exportFullBackupJSON,
  parseBackupJSON,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_TAX_DEDUCTIONS,
  EMPTY_TAX_DEDUCTIONS,
} from './utils/storage';
import { computeThaiTax, formatTHB } from './utils/thaiTax';
import { PORTFOLIO_CONFIGS, simulateCompoundGrowth } from './utils/investment';
import { getOfflineAIResponse } from './utils/offlineAdvisor';
import { MobileFrame } from './components/MobileFrame';
import { BottomNavBar, NavTabId } from './components/BottomNavBar';
import { CashFlowView, CATEGORY_MAP } from './components/CashFlowView';
import { TaxView } from './components/TaxView';
import { InvestmentView } from './components/InvestmentView';
import { AdvisorView } from './components/AdvisorView';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('cashflow');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => loadStoredDarkMode());
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  // 1. Cashflow & Category Budgets
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadStoredTransactions());
  const [budgets, setBudgets] = useState<CategoryBudgets>(() => loadStoredBudgets());

  // 2. Thai Tax state
  const initialTaxState = useMemo(() => loadStoredTaxState(), []);
  const [annualIncome, setAnnualIncome] = useState<number>(initialTaxState.income);
  const [incomeType, setIncomeType] = useState<IncomeSectionType>(initialTaxState.section);
  const [deductions, setDeductions] = useState<TaxDeductions>(initialTaxState.deductions);

  // 3. Investment & Inflation state
  const initialInvestState = useMemo(() => loadStoredInvestState(), []);
  const [age, setAge] = useState<number>(initialInvestState.age);
  const [targetAge, setTargetAge] = useState<number>(initialInvestState.targetAge);
  const [capital, setCapital] = useState<number>(initialInvestState.capital);
  const [monthly, setMonthly] = useState<number>(initialInvestState.monthly);
  const [risk, setRisk] = useState<RiskLevel>(initialInvestState.risk);
  const [inflationRate, setInflationRate] = useState<number>(initialInvestState.inflationRate);
  const [adjustInflation, setAdjustInflation] = useState<boolean>(
    initialInvestState.adjustInflation
  );

  // 4. Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredChat());

  // Persist states to localStorage
  useEffect(() => {
    saveStoredDarkMode(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredBudgets(budgets);
  }, [budgets]);

  useEffect(() => {
    saveStoredTaxState(annualIncome, incomeType, deductions);
  }, [annualIncome, incomeType, deductions]);

  useEffect(() => {
    saveStoredInvestState(
      age,
      targetAge,
      capital,
      monthly,
      risk,
      inflationRate,
      adjustInflation
    );
  }, [age, targetAge, capital, monthly, risk, inflationRate, adjustInflation]);

  useEffect(() => {
    saveStoredChat(messages);
  }, [messages]);

  // Compute Thai tax live
  const taxResult = useMemo(() => {
    return computeThaiTax(annualIncome, incomeType, deductions);
  }, [annualIncome, incomeType, deductions]);

  // Category label dictionary for CSV export
  const categoryLabels = useMemo(() => {
    const out: Record<string, string> = {};
    Object.entries(CATEGORY_MAP).forEach(([k, v]) => {
      out[k] = v.label;
    });
    return out;
  }, []);

  // CashFlow handlers
  const handleAddTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    setTransactions((prev) => [...prev, { ...t, id: Date.now() }]);
  }, []);

  const handleUpdateTransaction = useCallback((updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const handleDeleteTransaction = useCallback((id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleNavigateToTax = useCallback((calculatedAnnualIncome: number) => {
    if (calculatedAnnualIncome > 0) {
      setAnnualIncome(calculatedAnnualIncome);
    }
    setActiveTab('tax');
  }, []);

  const handleNavigateToInvest = useCallback((calculatedMonthly: number) => {
    if (calculatedMonthly > 0) {
      setMonthly(Math.round(calculatedMonthly));
    }
    setActiveTab('invest');
  }, []);

  const handleDeductionChange = useCallback(
    <K extends keyof TaxDeductions>(field: K, value: TaxDeductions[K]) => {
      setDeductions((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Investment Plan Evaluation (includes Inflation & 4% Safe Withdrawal Rule)
  const handleRunInvestAnalysis = useCallback(async (): Promise<string> => {
    const selectedConfig = PORTFOLIO_CONFIGS[risk];
    const sim = simulateCompoundGrowth(
      age,
      targetAge,
      capital,
      monthly,
      selectedConfig.returnRate,
      inflationRate / 100
    );
    const years = Math.max(1, targetAge - age);

    await new Promise((r) => setTimeout(r, 400));

    return `บทวิเคราะห์แผนความมั่งคั่ง & เกษียณ (${years} ปี)

1. มูลค่าพอร์ตและอำนาจซื้อจริง (เงินเฟ้อ ${inflationRate.toFixed(1)}%/ปี):
   • มูลค่าตัวเลข ณ อายุ ${targetAge} ปี: ${formatTHB(sim.finalWealth)}
   • อำนาจซื้อจริงเทียบค่าเงินวันนี้: ${formatTHB(sim.finalRealWealth)}
   • เงินต้นสะสมรวม: ${formatTHB(sim.totalSaved)} (กำไรทบต้น +${formatTHB(sim.profit)})

2. กระแสเงินสดถอนใช้หลังเกษียณ (กฎ 4% Safe Withdrawal):
   • ถอนใช้ได้เทียบค่าครองชีพวันนี้: ${formatTHB(sim.monthlySafeWithdrawalReal)} / เดือน
   • ยอดถอนตัวเลขจริงในอนาคต: ${formatTHB(sim.monthlySafeWithdrawalNominal)} / เดือน

3. คำแนะนำเชิงกลยุทธ์ (${selectedConfig.label}):
   ${
     risk === 'low'
       ? '• ผลตอบแทน 3.5%/ปี ใกล้เคียงเงินเฟ้อ ทำให้อำนาจซื้อจริงเติบโตช้า แนะนำแบ่งสัดส่วน 15–25% ไปยังหุ้นดัชนีโลกเพื่อชนะเงินเฟ้อระยะยาว'
       : risk === 'medium'
       ? '• พอร์ตสมดุล (~7.0%/ปี) ชนะเงินเฟ้อได้ประมาณ +4.5%/ปี เหมาะสมอย่างยิ่งกับการสร้างกองทุนเกษียณระยะยาวควบคู่กับการลดหย่อนภาษีผ่าน RMF/ThaiESG'
       : '• พอร์ตเติบโตสูง (~10.0%/ปี) สร้างพลังทบต้นได้ดีเยี่ยม แนะนำปรับลดความเสี่ยงลงสู่พอร์ตสมดุลในช่วง 5 ปีสุดท้ายก่อนถึงอายุเกษียณเพื่อล็อกกำไร'
   }`;
  }, [age, targetAge, capital, monthly, risk, inflationRate]);

  // Advisor Chat Handler
  const handleSendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: Date.now(),
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, userMsg]);

      await new Promise((r) => setTimeout(r, 350));
      const aiReplyText = getOfflineAIResponse(text, transactions, taxResult);

      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isOfflineAnswer: true,
      };

      setMessages((prev) => [...prev, aiMsg]);
    },
    [transactions, taxResult]
  );

  const handleClearChat = useCallback(() => {
    setMessages(getInitialChatMessages());
  }, []);

  // Offline Backup & CSV Export Handlers
  const showTemporaryNotice = (msg: string) => {
    setBackupNotice(msg);
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const handleExportCSV = useCallback(
    (listToExport: Transaction[], suffix: string) => {
      exportTransactionsToCSV(listToExport, categoryLabels, suffix);
      showTemporaryNotice(`ส่งออกไฟล์ CSV เรียบร้อยแล้ว (${listToExport.length} รายการ)`);
    },
    [categoryLabels]
  );

  const handleExportBackup = useCallback(() => {
    const payload: BackupPayload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
      tax: {
        income: annualIncome,
        section: incomeType,
        deductions,
      },
      invest: {
        age,
        targetAge,
        capital,
        monthly,
        risk,
        inflationRate,
        adjustInflation,
      },
      chat: messages,
    };
    exportFullBackupJSON(payload);
    showTemporaryNotice('ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว');
  }, [
    transactions,
    budgets,
    annualIncome,
    incomeType,
    deductions,
    age,
    targetAge,
    capital,
    monthly,
    risk,
    inflationRate,
    adjustInflation,
    messages,
  ]);

  const handleImportBackup = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || '');
      const restored = parseBackupJSON(content);
      if (!restored) {
        showTemporaryNotice('ไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์สำรอง JSON จาก WealthNavi');
        return;
      }

      setTransactions(restored.transactions);
      setBudgets(restored.budgets);
      setAnnualIncome(restored.tax.income);
      setIncomeType(restored.tax.section);
      setDeductions(restored.tax.deductions);
      setAge(restored.invest.age);
      setTargetAge(restored.invest.targetAge);
      setCapital(restored.invest.capital);
      setMonthly(restored.invest.monthly);
      setRisk(restored.invest.risk);
      setInflationRate(restored.invest.inflationRate);
      setAdjustInflation(restored.invest.adjustInflation);
      setMessages(restored.chat);
      showTemporaryNotice(`กู้คืนข้อมูลสำเร็จ (${restored.transactions.length} รายการ)`);
    };
    reader.readAsText(file);
  }, []);

  const handleClearTaxInputs = useCallback(() => {
    setAnnualIncome(0);
    setIncomeType('40_1_2');
    setDeductions(EMPTY_TAX_DEDUCTIONS);
    showTemporaryNotice('ล้างค่ารายได้และลดหย่อนภาษีเป็น 0 เรียบร้อย');
  }, []);

  const handleClearAllData = useCallback(() => {
    setTransactions([]);
    setBudgets({});
    setAnnualIncome(0);
    setIncomeType('40_1_2');
    setDeductions(EMPTY_TAX_DEDUCTIONS);
    setAge(25);
    setTargetAge(60);
    setCapital(0);
    setMonthly(0);
    setRisk('medium');
    setInflationRate(2.5);
    setAdjustInflation(false);
    setMessages(getInitialChatMessages());
    showTemporaryNotice('ล้างค่าระบบเป็น 0 ทั้งหมดแล้ว พร้อมเริ่มบันทึกใหม่!');
  }, []);

  const handleResetData = useCallback(() => {
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setAnnualIncome(720000);
    setIncomeType('40_1_2');
    setDeductions(INITIAL_TAX_DEDUCTIONS);
    setAge(28);
    setTargetAge(60);
    setCapital(100000);
    setMonthly(8000);
    setRisk('medium');
    setInflationRate(2.5);
    setAdjustInflation(false);
    setMessages(getInitialChatMessages());
    showTemporaryNotice('โหลดชุดข้อมูลตัวอย่างกลับมาเรียบร้อยแล้ว');
  }, []);

  const tabTitleMap: Record<NavTabId, string> = {
    cashflow: 'กระแสเงินสด & งบรายหมวด',
    tax: 'คำนวณภาษี & ThaiESG',
    invest: 'ลงทุนทบต้น & กฎ 4%',
    advisor: 'AI ที่ปรึกษาการเงิน',
  };

  return (
    <MobileFrame
      activeTabTitle={tabTitleMap[activeTab]}
      isDarkMode={isDarkMode}
      onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      onExportBackup={handleExportBackup}
      onExportCSV={() => handleExportCSV(transactions, 'all')}
      onImportBackup={handleImportBackup}
      backupNotice={backupNotice}
      onClearAllData={handleClearAllData}
      onResetData={handleResetData}
    >
      {activeTab === 'cashflow' && (
        <CashFlowView
          transactions={transactions}
          budgets={budgets}
          onAddTransaction={handleAddTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onUpdateBudgets={setBudgets}
          onExportCSV={handleExportCSV}
          onNavigateToTax={handleNavigateToTax}
          onNavigateToInvest={handleNavigateToInvest}
        />
      )}

      {activeTab === 'tax' && (
        <TaxView
          annualIncome={annualIncome}
          incomeType={incomeType}
          deductions={deductions}
          taxResult={taxResult}
          onChangeIncome={setAnnualIncome}
          onChangeIncomeType={setIncomeType}
          onChangeDeductions={handleDeductionChange}
          onClearTaxInputs={handleClearTaxInputs}
        />
      )}

      {activeTab === 'invest' && (
        <InvestmentView
          age={age}
          targetAge={targetAge}
          capital={capital}
          monthly={monthly}
          risk={risk}
          inflationRate={inflationRate}
          adjustInflation={adjustInflation}
          onChangeAge={setAge}
          onChangeTargetAge={setTargetAge}
          onChangeCapital={setCapital}
          onChangeMonthly={setMonthly}
          onChangeRisk={setRisk}
          onChangeInflationRate={setInflationRate}
          onToggleAdjustInflation={setAdjustInflation}
          onRunAIAnalysis={handleRunInvestAnalysis}
        />
      )}

      {activeTab === 'advisor' && (
        <AdvisorView
          messages={messages}
          transactions={transactions}
          taxResult={taxResult}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
        />
      )}

      {/* Persistent Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:absolute z-30">
        <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>
    </MobileFrame>
  );
}
