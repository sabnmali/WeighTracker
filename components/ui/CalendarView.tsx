import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeightLog } from '../../types';

interface CalendarViewProps {
  logs: WeightLog[];
  onDateClick: (date: Date, log?: WeightLog) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ logs, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const getLogForDay = (day: Date) => {
    // find the last log for the specific day
    return logs
      .filter(log => isSameDay(new Date(log.date), day))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="w-full animate-fade-in">
      <div className="flex items-center justify-between mb-4 px-2">
        <h4 className="text-lg font-bold text-slate-800 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-400 uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const log = getLogForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateClick(day, log)}
              className={`
                aspect-square p-1 rounded-xl flex flex-col items-center justify-start gap-1 relative border transition-all hover:scale-105 hover:shadow-md
                ${isCurrentMonth ? 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50' : 'bg-slate-50/50 dark:bg-slate-900/20 border-transparent opacity-50'}
                ${isToday ? 'ring-2 ring-blue-500/50 z-10' : ''}
              `}
            >
              <span className={`text-[10px] font-medium ${isToday ? 'text-blue-500' : 'text-slate-400'}`}>
                {format(day, 'd')}
              </span>
              
              {log && (
                <div className="flex-1 flex items-center justify-center w-full">
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-md px-1 py-0.5 w-full flex justify-center">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">
                            {log.weight}
                        </span>
                    </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;