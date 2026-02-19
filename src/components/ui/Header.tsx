import React from 'react';
import { LucideIcon } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, description, icon: Icon, actions, onBack }) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-8 mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="flex items-start gap-6">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Retour à la page précédente"
            title="Retour à la page précédente"
            className="group flex items-center justify-center bg-white p-4 rounded-2xl shadow-soft border-2 border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all duration-300 active:scale-90 h-16 w-16 shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-1 transition-transform"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        {Icon && !onBack && (
          <div className="hidden md:flex bg-slate-900 p-5 rounded-[1.5rem] shadow-premium text-white shrink-0 group hover:rotate-6 transition-transform duration-500 h-16 w-16 items-center justify-center">
            <Icon size={28} strokeWidth={2.5} />
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[0.9]">
            {title}
          </h2>
          {description && (
            <p className="text-slate-400 font-bold text-lg md:text-xl tracking-tight max-w-2xl opacity-90">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default Header;
