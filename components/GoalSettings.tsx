import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Target, Check } from 'lucide-react';

interface GoalSettingsProps {
  currentProfile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onClose: () => void;
}

const GoalSettings: React.FC<GoalSettingsProps> = ({ currentProfile, onSave, onClose }) => {
  const [targetWeight, setTargetWeight] = useState(currentProfile.targetWeight || '');
  const [targetDate, setTargetDate] = useState(currentProfile.targetDate || '');

  const handleSave = () => {
    onSave({
        ...currentProfile,
        targetWeight: Number(targetWeight),
        targetDate: targetDate
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                     <Target size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Define Your Target</h3>
            </div>
            
            <div className="space-y-4 mb-8">
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Target Weight (kg)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.1"
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all pl-4"
                            placeholder="e.g. 70.0"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Target Date</label>
                    <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    Cancel
                </button>
                <div className="flex-1">
                     <button 
                        onClick={handleSave}
                        className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                     >
                        <Check size={18} />
                        Commit to Goal
                     </button>
                </div>
               
            </div>
        </div>
    </div>
  );
};

export default GoalSettings;