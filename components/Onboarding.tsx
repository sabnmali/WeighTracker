import React, { useState } from 'react';
import { UserProfile, Gender, ActivityLevel } from '../types';
import { ACTIVITY_MULTIPLIERS } from '../constants';
import ParticleButton from './ui/ParticleButton';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.height && formData.currentWeight && formData.age && formData.gender && formData.activityLevel) {
      onComplete(formData as UserProfile);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 animate-fade-in">
      <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">Welcome</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Let's calculate your baseline metrics.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Gender</label>
                <div className="flex gap-2">
                    {[Gender.Male, Gender.Female].map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => setFormData({...formData, gender: g})}
                            className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${formData.gender === g ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Age</label>
                 <input
                    name="age"
                    type="number"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="25"
                    onChange={handleChange}
                  />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Height (cm)</label>
            <input
            name="height"
            type="number"
            required
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="175"
            onChange={handleChange}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Current Weight (kg)</label>
            <input
            name="currentWeight"
            type="number"
            step="0.1"
            required
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="80.5"
            onChange={handleChange}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Activity Level</label>
            <select
                name="activityLevel"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={handleChange}
                value={formData.activityLevel}
            >
                {Object.keys(ACTIVITY_MULTIPLIERS).map((level) => (
                    <option key={level} value={level}>{level}</option>
                ))}
            </select>
        </div>

        <div className="pt-4">
            <ParticleButton type="submit" className="w-full">
                Get Started
            </ParticleButton>
        </div>
      </form>
    </div>
  );
};

export default Onboarding;