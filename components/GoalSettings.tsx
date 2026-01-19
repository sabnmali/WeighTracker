import React, { useState } from 'react';
import { UserProfile } from '../types';
import ParticleButton from './ui/ParticleButton';

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
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Set Your Goal</h3>
            
            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Target Weight (kg)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Target Date</label>
                    <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    Cancel
                </button>
                <div className="flex-1">
                     <ParticleButton onClick={handleSave} className="w-full">
                        Save Goal
                     </ParticleButton>
                </div>
               
            </div>
        </div>
    </div>
  );
};

export default GoalSettings;