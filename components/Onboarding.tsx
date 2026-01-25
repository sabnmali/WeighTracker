import React, { useState, useMemo } from 'react';
import { UserProfile, Gender, ActivityLevel } from '../types';
import { ACTIVITY_DESCRIPTIONS } from '../constants';
import { calculateBMR, calculateTDEE } from '../services/calculator';
import ParticleButton from './ui/ParticleButton';
import { Activity, Flame, Info } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    gender: Gender.Male,
    activityLevel: ActivityLevel.Sedentary,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'height' || name === 'currentWeight' ? Number(value) : value,
    }));
  };

  const handleActivitySelect = (level: ActivityLevel) => {
      setFormData(prev => ({ ...prev, activityLevel: level }));
  };

  const calculatedMaintenance = useMemo(() => {
      if (formData.currentWeight && formData.height && formData.age && formData.gender && formData.activityLevel) {
          const bmr = calculateBMR(
              Number(formData.currentWeight), 
              Number(formData.height), 
              Number(formData.age), 
              formData.gender
          );
          return Math.round(calculateTDEE(bmr, formData.activityLevel));
      }
      return null;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.height && formData.currentWeight && formData.age && formData.gender && formData.activityLevel) {
      onComplete(formData as UserProfile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 animate-fade-in my-10">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black mb-3 text-slate-800 dark:text-slate-100 tracking-tight">Welcome</h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Let's calculate your baseline metrics to build your plan.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
        
        {/* Basic Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {[Gender.Male, Gender.Female].map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setFormData({...formData, gender: g})}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${formData.gender === g ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-none'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Age</label>
                     <input
                        name="age"
                        type="number"
                        required
                        min="1"
                        max="120"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        placeholder="e.g. 25"
                        onChange={handleChange}
                      />
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Height (cm)</label>
                    <input
                    name="height"
                    type="number"
                    required
                    min="50"
                    max="300"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    placeholder="e.g. 175"
                    onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Current Weight (kg)</label>
                    <input
                    name="currentWeight"
                    type="number"
                    step="0.1"
                    required
                    min="20"
                    max="500"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    placeholder="e.g. 80.5"
                    onChange={handleChange}
                    />
                </div>
            </div>
        </div>

        {/* Activity Level */}
        <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Activity size={16} /> Activity Level
            </label>
            <div className="grid grid-cols-1 gap-3">
                {Object.values(ActivityLevel).map((level) => (
                    <button
                        key={level}
                        type="button"
                        onClick={() => handleActivitySelect(level)}
                        className={`text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                            formData.activityLevel === level 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600'
                        }`}
                    >
                        <div>
                            <div className={`font-bold ${formData.activityLevel === level ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                {level}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {ACTIVITY_DESCRIPTIONS[level]}
                            </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.activityLevel === level ? 'border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                            {formData.activityLevel === level && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Real-time TDEE Preview */}
        {calculatedMaintenance && (
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full text-orange-600 dark:text-orange-400 mt-1">
                    <Flame size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-orange-100">Estimated Maintenance</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Based on your stats, you need approx <strong>{calculatedMaintenance} kcal</strong> daily to maintain your current weight.
                    </p>
                </div>
            </div>
        )}

        <div className="pt-2">
            <ParticleButton type="submit" className="w-full text-lg">
                Create Profile & Start
            </ParticleButton>
        </div>
      </form>
    </div>
  );
};

export default Onboarding;