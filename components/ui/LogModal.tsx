import React, { useState, useEffect } from 'react';
import { WeightLog } from '../../types';
import { format } from 'date-fns';
import { Trash2, Save, X } from 'lucide-react';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: WeightLog) => void;
  onDelete?: (logId: string) => void;
  initialDate?: Date;
  existingLog?: WeightLog;
}

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, onSave, onDelete, initialDate, existingLog }) => {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingLog) {
        setWeight(existingLog.weight.toString());
        setDate(format(new Date(existingLog.date), 'yyyy-MM-dd'));
      } else {
        setWeight('');
        setDate(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      }
    }
  }, [isOpen, existingLog, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !date) return;

    onSave({
      id: existingLog ? existingLog.id : Date.now().toString(),
      date: new Date(date).toISOString(),
      weight: parseFloat(weight),
    });
    onClose();
  };

  const handleDelete = () => {
    if (existingLog && onDelete) {
      onDelete(existingLog.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {existingLog ? 'Edit Log' : 'Add Log'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 75.5"
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            {existingLog && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                title="Delete Log"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogModal;