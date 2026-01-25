import React, { useState } from 'react';
import { UserProfile, DietPlan } from '../types';
import { Target, Plus, ChevronRight, Check, Trash2, Calendar, ArrowRight, AlertTriangle } from 'lucide-react';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';

interface GoalSettingsProps {
  currentProfile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onClose: () => void;
}

const GoalSettings: React.FC<GoalSettingsProps> = ({ currentProfile, onSave, onClose }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [plans, setPlans] = useState<DietPlan[]>(currentProfile.plans || []);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  
  // Validation State
  const [error, setError] = useState<string | null>(null);

  const handleCreateNew = () => {
      setEditingId(null);
      setEditName(`Plan ${plans.length + 1}`);
      setEditWeight('');
      setEditDate('');
      setEditStartDate(format(new Date(), 'yyyy-MM-dd'));
      setError(null);
      setView('edit');
  };

  const handleEdit = (plan: DietPlan) => {
      setEditingId(plan.id);
      setEditName(plan.name);
      setEditWeight(plan.targetWeight.toString());
      setEditDate(plan.targetDate);
      setEditStartDate(plan.startDate);
      setError(null);
      setView('edit');
  };

  const handleDelete = (id: string) => {
      const updatedPlans = plans.filter(p => p.id !== id);
      setPlans(updatedPlans);
      onSave({ ...currentProfile, plans: updatedPlans });
  };

  const handleSetActive = (id: string) => {
      const updatedPlans = plans.map(p => ({
          ...p,
          isActive: p.id === id
      }));
      setPlans(updatedPlans);
      onSave({ ...currentProfile, plans: updatedPlans });
  };

  const validateInputs = (): boolean => {
      if (!editWeight || !editDate || !editName || !editStartDate) {
          setError("All fields are required.");
          return false;
      }

      const start = startOfDay(parseISO(editStartDate));
      const target = startOfDay(parseISO(editDate));
      const today = startOfDay(new Date());

      if (isBefore(target, start)) {
          setError("Target date cannot be before the start date.");
          return false;
      }
      
      // We generally want target date to be in the future relative to today for a new plan,
      // but if editing an old plan, it might be in the past.
      // However, for active planning:
      if (isBefore(target, today) && !editingId) {
           setError("Target date should be in the future.");
           return false;
      }

      if (parseFloat(editWeight) <= 0) {
          setError("Target weight must be greater than 0.");
          return false;
      }

      setError(null);
      return true;
  };

  const handleSavePlan = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!validateInputs()) return;

      const newPlan: DietPlan = {
          id: editingId || Date.now().toString(),
          name: editName,
          targetWeight: parseFloat(editWeight),
          targetDate: editDate,
          startDate: editStartDate,
          isActive: editingId ? (plans.find(p => p.id === editingId)?.isActive || false) : (plans.length === 0)
      };

      let updatedPlans;
      if (editingId) {
          updatedPlans = plans.map(p => p.id === editingId ? newPlan : p);
      } else {
          updatedPlans = [...plans, newPlan];
          // If it's the first plan, make it active
          if (updatedPlans.length === 1) updatedPlans[0].isActive = true;
      }

      setPlans(updatedPlans);
      onSave({ ...currentProfile, plans: updatedPlans });
      setView('list');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <Target size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {view === 'list' ? 'My Diet Plans' : (editingId ? 'Edit Plan' : 'New Plan')}
                        </h3>
                        {view === 'edit' && <p className="text-xs text-slate-500">Define your goals</p>}
                    </div>
                </div>
                {view === 'list' && (
                     <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Close</button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {view === 'list' ? (
                    <div className="space-y-4">
                        {plans.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <p>No plans created yet.</p>
                                <button onClick={handleCreateNew} className="mt-4 text-blue-500 font-semibold hover:underline">Create your first plan</button>
                            </div>
                        ) : (
                            plans.map(plan => (
                                <div key={plan.id} className={`group relative p-4 rounded-2xl border-2 transition-all ${plan.isActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-800'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div onClick={() => handleSetActive(plan.id)} className="cursor-pointer flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">{plan.name}</h4>
                                                {plan.isActive && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                <Target size={14} />
                                                <span>Target: <b className="text-slate-700 dark:text-slate-300">{plan.targetWeight}kg</b></span>
                                                <span className="mx-1">•</span>
                                                <Calendar size={14} />
                                                <span>{format(new Date(plan.targetDate), 'MMM d, yyyy')}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleEdit(plan)}
                                                className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Action footer for item */}
                                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button 
                                            onClick={() => handleDelete(plan.id)}
                                            className="text-red-400 hover:text-red-600 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                        {!plan.isActive && (
                                            <button 
                                                onClick={() => handleSetActive(plan.id)}
                                                className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase tracking-wider"
                                            >
                                                Set Active
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        
                        <button 
                            onClick={handleCreateNew}
                            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-blue-500 hover:border-blue-300 transition-all font-medium"
                        >
                            <Plus size={20} /> Create New Plan
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSavePlan} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Plan Name</label>
                            <input
                                type="text"
                                required
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                placeholder="e.g. Summer Cut 2024"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={editStartDate}
                                    onChange={(e) => setEditStartDate(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Date</label>
                                <input
                                    type="date"
                                    required
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className={`w-full bg-slate-100 dark:bg-slate-800 border rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 outline-none transition-colors ${error && error.includes('date') ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'}`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Weight (kg)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={editWeight}
                                    onChange={(e) => setEditWeight(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none pl-4 transition-colors"
                                    placeholder="e.g. 70.0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">kg</span>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                             <button 
                                type="button"
                                onClick={() => setView('list')}
                                className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                            >
                                <Check size={18} /> Save Plan
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    </div>
  );
};

export default GoalSettings;