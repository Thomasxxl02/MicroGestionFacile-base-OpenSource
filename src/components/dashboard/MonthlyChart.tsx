import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';

export interface MonthlyDataPoint {
  name: string;
  Recettes: number;
  Avoirs: number;
  Net: number;
}

interface MonthlyChartProps {
  monthlyData: MonthlyDataPoint[];
  isDarkMode: boolean;
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ monthlyData, isDarkMode }) => {
  return (
    <Card
      title="Recettes"
      subtitle="Analyse de l'historique annuel"
      className="lg:col-span-2 border-none shadow-premium"
      headerActions={
        <div className="flex bg-muted/50 p-1.5 rounded-xl border border-border/50">
          <button className="px-4 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-premium text-primary">
            Mensuel
          </button>
          <button className="px-4 py-1.5 text-muted-foreground/60 rounded-lg text-[10px] font-black tracking-widest uppercase hover:text-foreground transition-colors">
            Trimestriel
          </button>
        </div>
      }
    >
      <div className="h-[400px] mt-4" data-testid="recharts-barchart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
            data-testid="recharts-barchart-inner"
          >
            <defs>
              <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="8 8"
              vertical={false}
              stroke={isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 800 }}
              dy={15}
              data-testid="recharts-xaxis"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 800 }}
              tickFormatter={(v) => (v === 0 ? '0' : `${v / 1000}k`)}
              data-testid="recharts-yaxis"
            />
            <Tooltip
              data-testid="recharts-tooltip"
              cursor={{
                fill: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                radius: 12,
              }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card/95 backdrop-blur-xl border border-border p-5 rounded-3xl shadow-2xl">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 border-b border-border/50 pb-2">
                        {label}
                      </p>
                      <div className="space-y-2">
                        {payload.map((item, i) => (
                          <div key={i} className="flex justify-between items-center gap-8">
                            <span className="text-xs font-bold text-muted-foreground capitalize">
                              {item.name}
                            </span>
                            <span className="text-sm font-black text-foreground">
                              {item.value?.toLocaleString('fr-FR')} €
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              name="Recettes"
              dataKey="Recettes"
              fill="url(#colorRecettes)"
              radius={[10, 10, 10, 10]}
              barSize={24}
              data-testid="recharts-bar"
            />
            <Bar
              name="Avoirs"
              dataKey="Avoirs"
              fill="#f43f5e"
              radius={[10, 10, 10, 10]}
              barSize={24}
              opacity={0.3}
              data-testid="recharts-bar"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default MonthlyChart;
