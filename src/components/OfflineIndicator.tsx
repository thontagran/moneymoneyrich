import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        <span>ออฟไลน์</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      <span>พร้อมใช้</span>
    </span>
  );
};
