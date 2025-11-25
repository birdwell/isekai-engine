import React from 'react';

interface IconButtonProps {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  title?: string;
  disabled?: boolean;
  variant?: 'default' | 'primary';
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  onClick, 
  icon, 
  title, 
  disabled = false,
  variant = 'default',
  className = ''
}) => {
  const baseClasses = "p-2 rounded-full border transition-all shadow-lg backdrop-blur-sm";
  const variantClasses = variant === 'primary'
    ? "bg-slate-900/80 hover:bg-amber-600 text-white border-slate-600 hover:border-amber-400"
    : "bg-slate-900/80 hover:bg-slate-700 text-slate-200 border-slate-600 hover:border-slate-400";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
      title={title}
    >
      {icon}
    </button>
  );
};
