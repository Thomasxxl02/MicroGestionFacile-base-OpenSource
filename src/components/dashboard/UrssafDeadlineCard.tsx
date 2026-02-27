import React from 'react';
import { Zap } from 'lucide-react';
import Card from '../ui/Card';

interface DeadlineInfo {
  date: Date;
  label: string;
  period: string;
}

interface UrssafDeadlineCardProps {
  deadline: DeadlineInfo;
}

const UrssafDeadlineCard: React.FC<UrssafDeadlineCardProps> = ({ deadline }) => {
  return (
    <Card className="flex flex-col items-center text-center p-10 bg-primary border-none text-white relative overflow-hidden shadow-2xl shadow-primary/20 group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl group-hover:bg-black/20 transition-all duration-700" />

      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center text-white mb-6 animate-pulse relative z-10">
        <Zap size={32} fill="white" className="drop-shadow-lg" />
      </div>
      <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.25em] mb-2 relative z-10">
        Prochain défi
      </p>
      <h4 className="text-2xl font-black mb-3 leading-tight relative z-10">{deadline.label}</h4>
      <div className="bg-white text-primary px-6 py-2 rounded-2xl text-sm font-black mb-6 shadow-2xl relative z-10 group-hover:scale-105 transition-transform">
        {deadline.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
      </div>
      <p className="text-[10px] text-white/50 font-black uppercase tracking-widest relative z-10">
        Période de {deadline.period}
      </p>
    </Card>
  );
};

export default UrssafDeadlineCard;
