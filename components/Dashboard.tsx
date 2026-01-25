import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Label } from 'recharts';
import { WeightLog, UserProfile, CalculationResult, DietPlan } from '../types';
import { 
    format, 
    subDays, 
    isSameDay, 
    startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth, 
    startOfYear, 
    endOfYear, 
    addWeeks, 
    subWeeks, 
    addMonths, 
    subMonths, 
    addYears, 
    subYears,
    isWithinInterval,
    differenceInWeeks,
    differenceInDays,
    differenceInMonths,
    parseISO,
    getISOWeek,
    getYear
} from 'date-fns';
import { Target, TrendingDown, TrendingUp, Flame, Dumbbell, AlertCircle, Calendar, List, Download, Pencil, ChevronDown, Check, Plus, ChevronLeft, ChevronRight, BarChart2, Clock, CalendarDays, BarChart3, LineChart } from 'lucide-react';
import CalendarView from './ui/CalendarView';
import LogModal from './ui/LogModal';

interface DashboardProps {
  logs: WeightLog[];
  profile: UserProfile;
  metrics: CalculationResult | null;
  activePlan: DietPlan | undefined;
  onAddLog: (weight: number) => void;
  onUpdateLog: (log: WeightLog) => void;
  onDeleteLog: (id: string) => void;
  onOpenSettings: () => void;
  onSelectPlan: (planId: string) => void;
}

type TimeRange = '1W' | '1M' | '1Y' | 'ALL';
type ViewMode = 'list' | 'calendar';
type HistoryGrouping = 'daily' | 'weekly_avg' | 'monthly_avg';

const Dashboard: React.FC<DashboardProps> = ({ logs, profile, metrics, activePlan, onAddLog, onUpdateLog, onDeleteLog, onOpenSettings, onSelectPlan }) => {
  const [newWeight, setNewWeight] = useState<string>('');
  
  // Initialize TimeRange from localStorage or default to '1M'
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
      const saved = localStorage.getItem('wt_dashboard_timeRange');
      return (saved as TimeRange) || '1M';
  });

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [historyGrouping, setHistoryGrouping] = useState<HistoryGrouping>('daily');
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  
  // Navigation State for Chart
  const [chartReferenceDate, setChartReferenceDate] = useState(new Date());

  // Specific Week Selector State (Index relative to all weeks, 0 = oldest week)
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | 'current'>('current');
  
  // Refs
  const planSelectorRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<WeightLog | undefined>(undefined);

  // Persist TimeRange changes
  useEffect(() => {
      localStorage.setItem('wt_dashboard_timeRange', timeRange);
  }, [timeRange]);

  // Click Outside Listener for Plan Selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (planSelectorRef.current && !planSelectorRef.current.contains(event.target as Node)) {
            setShowPlanSelector(false);
        }
    };

    if (showPlanSelector) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlanSelector]);

  // Reset reference date when time range changes
  useEffect(() => {
      setChartReferenceDate(new Date());
      // Reset specific week selection when range changes to something else
      if (timeRange !== '1W') setSelectedWeekIndex('current');
  }, [timeRange]);

  const getDateRangeLabel = () => {
      if (timeRange === 'ALL') return 'All Time';
      if (timeRange === '1W') {
          const start = startOfWeek(chartReferenceDate, { weekStartsOn: 1 });
          const end = endOfWeek(chartReferenceDate, { weekStartsOn: 1 });
          return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
      if (timeRange === '1M') return format(chartReferenceDate, 'MMMM yyyy');
      if (timeRange === '1Y') return format(chartReferenceDate, 'yyyy');
      return '';
  };

  const handleNavigateChart = (direction: 'prev' | 'next') => {
      if (timeRange === 'ALL') return;
      
      if (direction === 'prev') {
          if (timeRange === '1W') setChartReferenceDate(subWeeks(chartReferenceDate, 1));
          if (timeRange === '1M') setChartReferenceDate(subMonths(chartReferenceDate, 1));
          if (timeRange === '1Y') setChartReferenceDate(subYears(chartReferenceDate, 1));
      } else {
          if (timeRange === '1W') setChartReferenceDate(addWeeks(chartReferenceDate, 1));
          if (timeRange === '1M') setChartReferenceDate(addMonths(chartReferenceDate, 1));
          if (timeRange === '1Y') setChartReferenceDate(addYears(chartReferenceDate, 1));
      }
  };

  const filteredLogs = useMemo(() => {
    let interval: { start: Date; end: Date } | null = null;

    if (timeRange === '1W') {
        interval = {
            start: startOfWeek(chartReferenceDate, { weekStartsOn: 1 }),
            end: endOfWeek(chartReferenceDate, { weekStartsOn: 1 })
        };
    } else if (timeRange === '1M') {
        interval = {
            start: startOfMonth(chartReferenceDate),
            end: endOfMonth(chartReferenceDate)
        };
    } else if (timeRange === '1Y') {
        interval = {
            start: startOfYear(chartReferenceDate),
            end: endOfYear(chartReferenceDate)
        };
    }

    return logs
        .filter(log => {
            if (timeRange === 'ALL') return true;
            return interval ? isWithinInterval(new Date(log.date), interval) : true;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, timeRange, chartReferenceDate]);

  const chartData = useMemo(() => {
    return filteredLogs.map(log => ({
            date: format(new Date(log.date), 'MMM d'),
            fullDate: format(new Date(log.date), 'yyyy-MM-dd'),
            weight: log.weight,
        }));
  }, [filteredLogs]);


  // --- History Data Logic ---

  // Helper: Get Timeline Metric (Day #, Week #, Month #) relative to Plan Start or First Log
  const getTimelineMetric = (date: Date, type: 'day' | 'week' | 'month') => {
      const startDate = activePlan ? parseISO(activePlan.startDate) : (logs.length > 0 ? new Date(Math.min(...logs.map(l => new Date(l.date).getTime()))) : new Date());
      
      if (type === 'day') {
           const diff = differenceInDays(date, startDate) + 1;
           return diff > 0 ? `Day ${diff}` : 'Pre-Plan';
      }
      if (type === 'week') {
          const diff = differenceInWeeks(date, startDate) + 1;
          return diff > 0 ? `Week ${diff}` : 'Pre-Plan';
      }
      if (type === 'month') {
          const diff = differenceInMonths(date, startDate) + 1;
          return diff > 0 ? `Month ${diff}` : 'Pre-Plan';
      }
      return '-';
  };

  // Helper: Get Week Options for the dropdown
  const weekOptions = useMemo(() => {
      if (logs.length === 0) return [];
      const allDates = logs.map(l => new Date(l.date).getTime());
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));
      
      const weeks: { label: string, start: Date, end: Date, index: number }[] = [];
      let current = startOfWeek(minDate, { weekStartsOn: 1 });
      const last = endOfWeek(maxDate, { weekStartsOn: 1 });
      let idx = 0;

      while (current <= last) {
          const end = endOfWeek(current, { weekStartsOn: 1 });
          // Format based on Plan
          let label = `Week ${idx + 1}`;
          if (activePlan) {
             const planStart = parseISO(activePlan.startDate);
             const diff = differenceInWeeks(current, planStart) + 1;
             if (diff > 0) label = `Week ${diff}`;
             else label = `Pre-plan W${Math.abs(diff)}`;
          }
          
          label += ` (${format(current, 'MMM d')})`;

          weeks.push({ label, start: current, end: end, index: idx });
          current = addWeeks(current, 1);
          idx++;
      }
      return weeks.reverse(); // Newest first
  }, [logs, activePlan]);


  const historyData = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (historyGrouping === 'daily') {
        // Filter based on Selected Week Index ONLY if range is '1W' and specific week is chosen
        let viewLogs = sortedLogs;
        if (timeRange === '1W' && selectedWeekIndex !== 'current') {
             const selectedWeekObj = weekOptions.find(w => w.index === selectedWeekIndex);
             if (selectedWeekObj) {
                 viewLogs = sortedLogs.filter(log => isWithinInterval(new Date(log.date), { start: selectedWeekObj.start, end: selectedWeekObj.end }));
             }
        } else if (timeRange !== 'ALL') {
             // If not specifically selecting a week, use the filteredLogs logic (which follows chart range)
             viewLogs = [...filteredLogs].reverse(); 
        }

        return viewLogs.map(log => ({
            ...log,
            timelineLabel: getTimelineMetric(new Date(log.date), 'day')
        }));
    }

    if (historyGrouping === 'weekly_avg') {
        // Group by ISO Week
        const groups = new Map<string, { sum: number, count: number, start: Date }>();
        
        sortedLogs.forEach(log => {
            const date = new Date(log.date);
            const key = `${getYear(date)}-W${getISOWeek(date)}`;
            if (!groups.has(key)) {
                groups.set(key, { sum: 0, count: 0, start: startOfWeek(date, { weekStartsOn: 1 }) });
            }
            const g = groups.get(key)!;
            g.sum += log.weight;
            g.count += 1;
        });

        return Array.from(groups.values()).map(g => ({
            id: g.start.toISOString(),
            date: g.start.toISOString(),
            weight: g.sum / g.count,
            isAggregate: true,
            label: `${format(g.start, 'MMM d')} - ${format(endOfWeek(g.start, {weekStartsOn: 1}), 'MMM d')}`,
            timelineLabel: getTimelineMetric(g.start, 'week')
        }));
    }

    if (historyGrouping === 'monthly_avg') {
        // Group by Month
        const groups = new Map<string, { sum: number, count: number, start: Date }>();
        
        sortedLogs.forEach(log => {
            const date = new Date(log.date);
            const key = format(date, 'yyyy-MM');
            if (!groups.has(key)) {
                groups.set(key, { sum: 0, count: 0, start: startOfMonth(date) });
            }
            const g = groups.get(key)!;
            g.sum += log.weight;
            g.count += 1;
        });

        return Array.from(groups.values()).map(g => ({
            id: g.start.toISOString(),
            date: g.start.toISOString(),
            weight: g.sum / g.count,
            isAggregate: true,
            label: format(g.start, 'MMMM yyyy'),
            timelineLabel: getTimelineMetric(g.start, 'month')
        }));
    }
    
    return [];
  }, [logs, filteredLogs, historyGrouping, timeRange, selectedWeekIndex, weekOptions]);


  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWeight) {
        onAddLog(parseFloat(newWeight));
        setNewWeight('');
    }
  };

  const handleExport = () => {
      let exportLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const planStartDate = activePlan ? parseISO(activePlan.startDate) : (exportLogs.length > 0 ? new Date(exportLogs[0].date) : new Date());

      const headers = ['Week', 'Date', 'Timeline', 'Weight (kg)', 'Change (kg)', 'Visual Trend'];
      
      const rows = exportLogs.map((log, index) => {
          const logDate = new Date(log.date);
          const prevLog = index > 0 ? exportLogs[index - 1] : null;
          const change = prevLog ? (log.weight - prevLog.weight) : 0;
          
          let weekLabel = '-';
          if (activePlan) {
              if (logDate >= planStartDate) {
                  const weekNum = differenceInWeeks(logDate, planStartDate) + 1;
                  weekLabel = `Week ${weekNum}`;
              } else {
                  weekLabel = 'Pre-Plan';
              }
          } else {
              const firstDate = new Date(exportLogs[0].date);
              const weekNum = differenceInWeeks(logDate, firstDate) + 1;
              weekLabel = `Week ${weekNum}`;
          }

          const timelineStr = getTimelineMetric(logDate, 'day');
          
          const maxBars = 15;
          const barCount = Math.min(Math.abs(Math.round(change * 10)), maxBars); 
          let visualBar = '';
          if (change > 0) visualBar = 'Gained: ' + '█'.repeat(barCount); 
          else if (change < 0) visualBar = 'Lost: ' + '▒'.repeat(barCount); 
          else visualBar = '-';
          
          const changeStr = index === 0 ? '0' : (change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2));

          return [
              `"${weekLabel}"`,
              `"${format(logDate, 'yyyy-MM-dd')}"`, 
              `"${timelineStr}"`,
              `"${log.weight.toFixed(2)}"`,
              `"${changeStr}"`,
              `"${visualBar}"`
          ].join(',');
      });

      const csvContent = "\uFEFF" + headers.join(',') + "\n" + rows.join('\n');
      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `WT_Export_All_${activePlan?.name.replace(/\s+/g, '_') || 'History'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCalendarDateClick = (date: Date, log?: WeightLog) => {
      setSelectedDate(date);
      setSelectedLog(log);
      setIsLogModalOpen(true);
  };

  const handleListEditClick = (log: WeightLog) => {
      setSelectedDate(new Date(log.date));
      setSelectedLog(log);
      setIsLogModalOpen(true);
  };

  const handleModalSave = (log: WeightLog) => {
      onUpdateLog(log);
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
      
      {/* Plan Selector Header */}
      <div className="relative z-40" ref={planSelectorRef}>
        <button 
            onClick={() => setShowPlanSelector(!showPlanSelector)}
            className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
            {activePlan ? activePlan.name : "Select Plan"}
            <ChevronDown size={20} className={`transition-transform duration-300 ${showPlanSelector ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Aesthetic Sliding List */}
        <div className={`absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 origin-top ${showPlanSelector ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-0 -translate-y-4 pointer-events-none'}`}>
            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {profile.plans.length > 0 ? (
                    profile.plans.map(plan => (
                        <button
                            key={plan.id}
                            onClick={() => {
                                onSelectPlan(plan.id);
                                setShowPlanSelector(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${plan.id === activePlan?.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'}`}
                        >
                            <span className="font-medium truncate">{plan.name}</span>
                            {plan.id === activePlan?.id && <Check size={16} />}
                        </button>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No plans found.</div>
                )}
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                <button 
                    onClick={() => {
                        onOpenSettings();
                        setShowPlanSelector(false);
                    }}
                    className="w-full text-left p-3 rounded-xl flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                    <Plus size={16} /> Manage Plans
                </button>
            </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics && activePlan ? (
            <>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        {getDeficitIcon()} {getDeficitLabel()}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
                        {metrics.planMode === 'loss' ? '-' : '+'}
                        {Math.round(metrics.dailyDeficitRequired)} 
                        <span className="text-sm font-normal text-slate-500">kcal</span>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        {getWeeklyIcon()} Weekly {metrics.planMode === 'gain' ? 'Gain' : 'Loss'}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {metrics.weeklyLossRequired.toFixed(2)} <span className="text-sm font-normal text-slate-500">kg</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <Target size={14} className="text-green-500" /> Target Weight
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {activePlan.targetWeight} <span className="text-sm font-normal text-slate-500">kg</span>
                    </div>
                </div>

                 <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
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
                        <h3 className="font-semibold text-lg">No Active Plan</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Select or create a plan to see insights.</p>
                    </div>
                </div>
                <button 
                    onClick={onOpenSettings}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 font-medium transition-all transform hover:scale-105"
                >
                    <Target size={18} />
                    Create Plan
                </button>
            </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 h-[28rem]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Progress</h3>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                    {getDateRangeLabel()}
                </span>
            </div>
            
            <div className="flex items-center gap-2">
                 {/* Navigation Controls */}
                 {timeRange !== 'ALL' && (
                    <div className="flex gap-1 mr-2">
                        <button onClick={() => handleNavigateChart('prev')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-400 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => handleNavigateChart('next')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-400 transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                 )}

                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                    {(['1W', '1M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${timeRange === range ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
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
                animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* History List Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[400px]">
        
        {/* Header with Controls */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">History</h3>
                </div>

                <div className="flex items-center gap-3">
                     {/* Aesthetic Sliding History Mode Toggle */}
                     {viewMode === 'list' && (
                        <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 w-[280px] h-10 hidden sm:flex">
                             {/* Sliding Background */}
                             <div 
                                className="absolute inset-y-1 rounded-lg bg-white dark:bg-slate-700 shadow-sm transition-all duration-300 ease-out"
                                style={{
                                    width: '32%',
                                    left: historyGrouping === 'daily' ? '1%' : historyGrouping === 'weekly_avg' ? '34%' : '67%'
                                }}
                             />
                             
                             <button
                                onClick={() => setHistoryGrouping('daily')}
                                className={`flex-1 z-10 text-[10px] uppercase font-bold transition-colors flex items-center justify-center gap-1.5 ${historyGrouping === 'daily' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <CalendarDays size={14} /> Daily
                            </button>
                             <button
                                onClick={() => setHistoryGrouping('weekly_avg')}
                                className={`flex-1 z-10 text-[10px] uppercase font-bold transition-colors flex items-center justify-center gap-1.5 ${historyGrouping === 'weekly_avg' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <LineChart size={14} /> W. Avg
                            </button>
                            <button
                                onClick={() => setHistoryGrouping('monthly_avg')}
                                className={`flex-1 z-10 text-[10px] uppercase font-bold transition-colors flex items-center justify-center gap-1.5 ${historyGrouping === 'monthly_avg' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <BarChart3 size={14} /> M. Avg
                            </button>
                        </div>
                     )}

                     {/* Time Range Filters (Daily Only) */}
                     {viewMode === 'list' && historyGrouping === 'daily' && (
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 hidden sm:flex">
                            {(['1W', '1M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${timeRange === range ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            className="p-2 rounded-md transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Export CSV"
                        >
                            <Download size={18} />
                        </button>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                                title="List View"
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                                title="Calendar View"
                            >
                                <Calendar size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Specific Week Selector (Only visible if 1W selected in Daily Mode) */}
            {historyGrouping === 'daily' && timeRange === '1W' && viewMode === 'list' && weekOptions.length > 0 && (
                 <div className="flex items-center gap-2 animate-fade-in bg-slate-50 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Viewing:</span>
                    <select 
                        value={selectedWeekIndex} 
                        onChange={(e) => setSelectedWeekIndex(e.target.value === 'current' ? 'current' : Number(e.target.value))}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                    >
                        <option value="current">Current Selection (Chart)</option>
                        {weekOptions.map((opt) => (
                            <option key={opt.index} value={opt.index}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
        
        {/* Mobile View Toggle */}
        {viewMode === 'list' && (
             <div className="px-6 pb-2 sm:hidden space-y-2">
                 <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 justify-between relative">
                     <div 
                        className="absolute inset-y-1 bg-white dark:bg-slate-700 shadow-sm rounded-md transition-all duration-300 ease-out"
                        style={{
                            width: '32%',
                            left: historyGrouping === 'daily' ? '1%' : historyGrouping === 'weekly_avg' ? '34%' : '67%'
                        }}
                     />
                     {(['daily', 'weekly_avg', 'monthly_avg'] as HistoryGrouping[]).map((g) => (
                        <button
                            key={g}
                            onClick={() => setHistoryGrouping(g)}
                            className={`flex-1 z-10 px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${historyGrouping === g ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            {g === 'weekly_avg' ? 'W. Avg' : g === 'monthly_avg' ? 'M. Avg' : 'Daily'}
                        </button>
                     ))}
                 </div>
                 {historyGrouping === 'daily' && (
                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 justify-between">
                        {(['1W', '1M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`flex-1 px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${timeRange === range ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                 )}
             </div>
        )}

        {viewMode === 'calendar' ? (
            <div className="p-6">
                <CalendarView logs={logs} onDateClick={handleCalendarDateClick} />
            </div>
        ) : (
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {historyData.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No logs found for this period.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/3">
                                    Date
                                </th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                                    Timeline
                                </th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Weight</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Edit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {historyData.map((log, index) => {
                                const prevLog = historyData[index + 1]; 
                                const change = prevLog ? log.weight - prevLog.weight : 0;
                                const isLoss = change < 0;
                                const isGain = change > 0;
                                
                                const isAggregate = (log as any).isAggregate;
                                const label = isAggregate ? (log as any).label : format(new Date(log.date), 'MMM d, yyyy');
                                const timelineLabel = (log as any).timelineLabel;

                                return (
                                    <tr key={index} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                                            {label}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {timelineLabel}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-900 dark:text-white font-bold">
                                            {log.weight.toFixed(isAggregate ? 2 : 1)} kg
                                        </td>
                                        <td className="p-4">
                                            {index === historyData.length - 1 ? (
                                                <span className="text-slate-400 text-sm">-</span>
                                            ) : (
                                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${isLoss ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : isGain ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'text-slate-400'}`}>
                                                    {change > 0 ? '+' : ''}{change.toFixed(2)} kg
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {!isAggregate && (
                                                <button 
                                                    onClick={() => handleListEditClick(log)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Pencil size={16} />
                                                </button>
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
        <div 
            onClick={() => setShowPlanSelector(true)} // Open plan selector if input is clicked (as per one request) or just keep logic simple
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 flex gap-2 w-full max-w-md relative"
        >
             {/* If user clicks input, we could optionally show plan selector above it, but header selector is cleaner. 
                 The prompt asked "when entering data... select plan". 
                 Let's add a small active plan indicator here. */}
            <div className="absolute -top-3 left-4 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                {activePlan ? activePlan.name : 'No Plan'}
            </div>

            <input 
                type="number" 
                step="0.1" 
                placeholder="Log today's weight..."
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none px-4 pt-2 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500"
            />
            <button 
                onClick={(e) => { e.stopPropagation(); handleLogSubmit(e); }}
                className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-colors font-medium shadow-md shadow-blue-500/20"
            >
                Log
            </button>
        </div>
      </div>

      <LogModal 
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleModalSave}
        onDelete={onDeleteLog}
        initialDate={selectedDate}
        existingLog={selectedLog}
      />
    </div>
  );
};

export default Dashboard;