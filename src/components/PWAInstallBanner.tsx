import React, { useState } from 'react';
import { Download, Share2, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-3.5 py-2.5 rounded-2xl mx-3 my-2 shadow-md flex items-center justify-between gap-3 text-xs border border-indigo-400/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white">ติดตั้งแอพลงบนหน้าจอมือถือ</p>
            <p className="text-indigo-100 text-[11px]">เปิดใช้งานออฟไลน์ได้ทันที สะดวก รวดเร็ว</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isInstallable && (
            <button
              onClick={install}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ติดตั้ง</span>
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>วิธีติดตั้ง</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-indigo-200 hover:text-white rounded-lg transition"
            aria-label="ปิดแถบแจ้งเตือน"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">ติดตั้งบน iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <p>กดปุ่ม <strong className="text-slate-900 dark:text-white">แชร์ (Share)</strong> สัญลักษณ์รูปสี่เหลี่ยมมีลูกศรชี้ขึ้น ที่แถบเมนูด้านล่างของ Safari</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <p>เลื่อนลงมาแล้วเลือก <strong className="text-slate-900 dark:text-white">"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong></p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <p>กด <strong className="text-slate-900 dark:text-white">"เพิ่ม" (Add)</strong> ที่มุมขวาบน จะมีไอคอนแอพ WealthNavi ปรากฏบนหน้าจอโทรศัพท์ของคุณทันที</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full min-h-[44px] py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  );
};
