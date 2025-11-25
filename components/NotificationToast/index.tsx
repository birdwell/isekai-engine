import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export interface Notification {
  msg: string;
  type: 'success' | 'error';
}

interface NotificationToastProps {
  notification: Notification | null;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
  if (!notification) return null;

  return (
    <div className={`
      fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg border flex items-center gap-3 animate-fade-in transition-all
      ${notification.type === 'success' ? 'bg-slate-800 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-red-500/50 text-red-400'}
    `}>
      {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="font-bold text-sm tracking-wide">{notification.msg}</span>
    </div>
  );
};
