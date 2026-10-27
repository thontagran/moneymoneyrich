import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  Lightbulb,
} from 'lucide-react';
import { ChatMessage, Transaction, TaxCalculationResult } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ConfirmBottomSheet } from './ConfirmBottomSheet';

interface AdvisorViewProps {
  messages: ChatMessage[];
  transactions: Transaction[];
  taxResult: TaxCalculationResult;
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
}

export const AdvisorView: React.FC<AdvisorViewProps> = ({
  messages,
  onSendMessage,
  onClearChat,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOnline = useOnlineStatus();

  const quickQuestions = [
    'เปรียบเทียบ ThaiESG vs SSF vs RMF',
    'กฎ 4% ถอนเงินใช้หลังเกษียณคืออะไร?',
    'วิเคราะห์สุขภาพการเงินของฉัน',
    'เทคนิคประหยัดภาษีปีนี้ให้คุ้มที่สุด',
    'มีเงิน 100,000 บาท จัดพอร์ตยังไงดี?',
    'หุ้นต่างประเทศและ S&P 500 น่าลงทุนไหม?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query || isLoading) return;

    setInput('');
    setIsLoading(true);

    try {
      await onSendMessage(query);
    } catch (e) {
      console.warn('Error sending message:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-150px)] max-h-[750px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {/* Advisor Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 backdrop-blur-xs rounded-2xl flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">WealthNavi AI</h3>
              <p className="text-[11px] text-indigo-200">
                {isOnline
                  ? 'ที่ปรึกษาการเงินส่วนตัว · พร้อมใช้งาน'
                  : 'โหมดออฟไลน์ · ประมวลผลในเครื่อง'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="ล้างการสนทนา"
            aria-label="ล้างการสนทนา"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Buttons */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 w-max">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 px-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>คำถามด่วน:</span>
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="min-h-[36px] text-[11px] bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors disabled:opacity-50 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/60 dark:bg-slate-950/60">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-3xl text-xs leading-relaxed space-y-1 whitespace-pre-wrap ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-bl-xs'
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-slate-100 dark:border-slate-700 text-[10px] text-slate-400 tabular-nums">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>WealthNavi Advisor</span>
                      </span>
                      <span>{m.timestamp}</span>
                    </div>
                  )}

                  <div className="leading-relaxed">{m.text}</div>

                  {isUser && (
                    <div className="text-right text-[9px] text-indigo-200 pt-0.5 tabular-nums">
                      {m.timestamp}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl rounded-bl-xs text-xs text-slate-500 dark:text-slate-300">
                กำลังประมวลผลคำแนะนำ...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ถามเรื่อง ThaiESG, กฎ 4%, หรือสุขภาพการเงิน..."
            className="flex-1 min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-white placeholder:text-slate-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="min-h-[44px] min-w-[44px] p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            aria-label="ส่งข้อความ"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Custom Bottom Sheet Confirmation for Clearing Chat */}
      <ConfirmBottomSheet
        isOpen={showClearConfirm}
        title="ล้างประวัติการสนทนาทั้งหมด?"
        description="ข้อความสนทนากับ WealthNavi AI จะถูกลบและเริ่มต้นบทสนทนาใหม่"
        confirmLabel="ล้างการสนทนา"
        cancelLabel="ยกเลิก"
        variant="danger"
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          onClearChat();
          setShowClearConfirm(false);
        }}
      />
    </>
  );
};
