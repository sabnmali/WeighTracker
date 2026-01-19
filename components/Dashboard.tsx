import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { WeightLog, UserProfile, CalculationResult } from '../types';
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { Target, TrendingDown, Flame, AlertCircle } from 'lucide-react';

interface DashboardProps {
  logs: WeightLog[];
  profile: UserProfile;
  metrics: CalculationResult | null;
  onAddLog: (weight: number) => void;
}

type TimeRange = '1W' | '1M' | '1Y' | 'ALL';

const Dashboard: React.FC<DashboardProps> = ({ logs, profile, metrics, onAddLog }) => {
  const [newWeight, setNewWeight] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  const chartData = useMemo(() => {
    // Sort logs by date
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Filter based on time range
    const now = new Date();
    let startDate = subDays(now, 3650); // default ALL
    
    if (timeRange === '1W') startDate = subDays(now, 7);
    if (timeRange === '1M') startDate = subDays(now, 30);
    if (timeRange === '1Y') startDate = subDays(now, 365);

    return sorted
        .filter(log => new Date(log.date) >= startDate)
        .map(log => ({
            date: format(new Date(log.date), 'MMM d'),
            weight: log.weight,
        }));
  }, [logs, timeRange]);

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWeight) {
        onAddLog(parseFloat(newWeight));
        setNewWeight('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 animate-slide-up pb-24">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics ? (
            <>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <Flame size={14} className="text-orange-500" /> Daily Target
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {Math.round(metrics.dailyCalorieTarget)} <span className="text-sm font-normal text-slate-500">kcal</span>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <TrendingDown size={14} className="text-blue-500" /> Weekly Loss
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {metrics.weeklyLossRequired.toFixed(2)} <span className="text-sm font-normal text-slate-500">kg</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <Target size={14} className="text-green-500" /> Goal
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {profile.targetWeight} <span className="text-sm font-normal text-slate-500">kg</span>
                    </div>
                </div>

                 <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        Current
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {profile.currentWeight} <span className="text-sm font-normal text-slate-500">kg</span>
                    </div>
                </div>
            </>
        ) : (
            <div className="col-span-full p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} />
                <span>Please set a goal to see detailed metrics.</span>
            </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 h-96">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Progress</h3>
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                {(['1W', '1M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${timeRange === range ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        {range}
                    </button>
                ))}
            </div>
        </div>
        
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
            <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                dy={10}
            />
            <YAxis 
                domain={['auto', 'auto']} 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                width={30}
            />
            <Tooltip 
                contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                itemStyle={{color: '#fff'}}
            />
            <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Log Action */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-50">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 flex gap-2 w-full max-w-md">
            <input 
                type="number" 
                step="0.1" 
                placeholder="Log today's weight..."
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none px-4 text-slate-900 dark:text-white placeholder:text-slate-500"
            />
            <button 
                onClick={handleLogSubmit}
                className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-colors font-medium"
            >
                Log
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;