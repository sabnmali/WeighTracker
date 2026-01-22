import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Label } from 'recharts';
import { WeightLog, UserProfile, CalculationResult } from '../types';
import { format, subDays, isSameDay } from 'date-fns';
import { Target, TrendingDown, TrendingUp, Flame, Dumbbell, AlertCircle, Calendar, List, ChevronRight } from 'lucide-react';
import CalendarView from './ui/CalendarView';

interface DashboardProps {
  logs: WeightLog[];
  profile: UserProfile;
  metrics: CalculationResult | null;
  onAddLog: (weight: number) => void;
  onOpenSettings: () => void;
}

type TimeRange = '1W' | '1M' | '1Y' | 'ALL';
type ViewMode = 'list' | 'calendar';

const Dashboard: React.FC<DashboardProps> = ({ logs, profile, metrics, onAddLog, onOpenSettings }) => {
  const [newWeight, setNewWeight] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filteredLogs = useMemo(() => {
    const now = new Date();
    let startDate = subDays(now, 3650); // default ALL
    
    if (timeRange === '1W') startDate = subDays(now, 7);
    if (timeRange === '1M') startDate = subDays(now, 30);
    if (timeRange === '1Y') startDate = subDays(now, 365);

    return logs
        .filter(log => new Date(log.date) >= startDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, timeRange]);

  const chartData = useMemo(() => {
    return filteredLogs.map(log => ({
            date: format(new Date(log.date), 'MMM d'),
            fullDate: format(new Date(log.date), 'yyyy-MM-dd'),
            weight: log.weight,
        }));
  }, [filteredLogs]);

  const historyData = useMemo(() => {
    // Reverse for history list (newest first)
    return [...filteredLogs].reverse();
  }, [filteredLogs]);

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWeight) {
        onAddLog(parseFloat(newWeight));
        setNewWeight('');
    }
  };

  const getDeficitIcon = () => {
    if (metrics?.planMode === 'gain') return <Dumbbell size={14} className="text-purple-500" />;
    return <Flame size={14} className="text-orange-500" />;
  };

  const getDeficitLabel = () => {
     if (metrics?.planMode === 'gain') return "Daily Surplus";
     return "Daily Deficit";
  };

  const getWeeklyIcon = () => {
     if (metrics?.planMode === 'gain') return <TrendingUp size={14} className="text-green-500" />;
     return <TrendingDown size={14} className="text-blue-500" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 animate-slide-up pb-24">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics ? (
            <>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        {getDeficitIcon()} {getDeficitLabel()}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
                        {metrics.planMode === 'loss' ? '-' : '+'}
                        {Math.round(metrics.dailyDeficitRequired)} 
                        <span className="text-sm font-normal text-slate-500">kcal</span>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        {getWeeklyIcon()} Weekly {metrics.planMode === 'gain' ? 'Gain' : 'Loss'}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {metrics.weeklyLossRequired.toFixed(2)} <span className="text-sm font-normal text-slate-500">kg</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <Target size={14} className="text-green-500" /> Target Weight
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {profile.targetWeight} <span className="text-sm font-normal text-slate-500">kg</span>
                    </div>
                </div>

                 <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        Current Weight
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {profile.currentWeight} <span className="text-sm font-normal text-slate-500">kg</span>
                    </div>
                </div>
            </>
        ) : (
            <div className="col-span-full p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 text-slate-800 dark:text-slate-200 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white dark:bg-white/10 rounded-full text-indigo-500">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Goal Missing</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Set a target to unlock personalized insights.</p>
                    </div>
                </div>
                <button 
                    onClick={onOpenSettings}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 font-medium transition-all transform hover:scale-105"
                >
                    <Target size={18} />
                    Set Your Goal
                </button>
            </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 h-[28rem]">
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
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
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
                dy={15}
                height={50}
            >
                <Label value="Date" offset={0} position="insideBottom" style={{ fill: '#64748b', fontSize: '12px' }} />
            </XAxis>
            <YAxis 
                domain={['auto', 'auto']} 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                width={50}
            >
                 <Label value="Weight (kg)" angle={-90} position="outside" dx={-20} style={{ fill: '#64748b', fontSize: '12px' }} />
            </YAxis>
            <Tooltip 
                contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                itemStyle={{color: '#fff'}}
                labelFormatter={(label) => `Date: ${label}`}
            />
            <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
                animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* History List Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">History</h3>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                    title="List View"
                >
                    <List size={16} />
                </button>
                <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                    title="Calendar View"
                >
                    <Calendar size={16} />
                </button>
            </div>
        </div>

        {viewMode === 'calendar' ? (
            <div className="p-6">
                <CalendarView logs={logs} />
            </div>
        ) : (
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {historyData.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No logs found for this period.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Weight</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {historyData.map((log, index) => {
                                const prevLog = historyData[index + 1]; // Since it's reversed (newest first), prev index is older
                                const change = prevLog ? log.weight - prevLog.weight : 0;
                                const isLoss = change < 0;
                                const isGain = change > 0;
                                
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                                            {format(new Date(log.date), 'MMM d, yyyy')}
                                        </td>
                                        <td className="p-4 text-slate-900 dark:text-white font-bold">
                                            {log.weight} kg
                                        </td>
                                        <td className="p-4">
                                            {index === historyData.length - 1 ? (
                                                <span className="text-slate-400 text-sm">-</span>
                                            ) : (
                                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${isLoss ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : isGain ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'text-slate-400'}`}>
                                                    {change > 0 ? '+' : ''}{change.toFixed(1)} kg
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        )}
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