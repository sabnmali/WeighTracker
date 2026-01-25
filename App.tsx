import React, { useState, useEffect } from 'react';
import Logo from './components/ui/Logo';
import ThemeToggle from './components/ui/ThemeToggle';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import GoalSettings from './components/GoalSettings';
import { getProfile, saveProfile, getLogs, saveLogs } from './services/storage';
import { calculateDeficit } from './services/calculator';
import { UserProfile, WeightLog, CalculationResult, DietPlan } from './types';
import { isSameDay, format } from 'date-fns';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [metrics, setMetrics] = useState<CalculationResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize data & Migration Logic
  useEffect(() => {
    const savedProfile = getProfile();
    const savedLogs = getLogs();
    
    if (savedProfile) {
        // Migration: If profile has old target fields but no plans array, create default plan
        if (!savedProfile.plans) {
            savedProfile.plans = [];
            if (savedProfile.targetWeight && savedProfile.targetDate) {
                const defaultPlan: DietPlan = {
                    id: Date.now().toString(),
                    name: 'My First Goal',
                    startDate: format(new Date(), 'yyyy-MM-dd'), // approximate
                    targetWeight: savedProfile.targetWeight,
                    targetDate: savedProfile.targetDate,
                    isActive: true
                };
                savedProfile.plans.push(defaultPlan);
            }
            saveProfile(savedProfile);
        }
        setProfile(savedProfile);
    }
    
    if (savedLogs) setLogs(savedLogs);
    
    setLoading(false);
  }, []);

  // Get Active Plan
  const activePlan = profile?.plans?.find(p => p.isActive);

  // Update metrics whenever profile, logs, or active plan changes
  useEffect(() => {
    if (profile) {
        const latestLog = logs.length > 0 
            ? logs.reduce((prev, current) => (new Date(prev.date) > new Date(current.date) ? prev : current))
            : null;

        const effectiveProfile = latestLog 
            ? { ...profile, currentWeight: latestLog.weight }
            : profile;

        // Calculate based on ACTIVE plan
        const result = calculateDeficit(effectiveProfile, activePlan);
        setMetrics(result);
    }
  }, [profile, logs, activePlan]);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    // Ensure plans array exists
    if (!newProfile.plans) newProfile.plans = [];
    
    saveProfile(newProfile);
    setProfile(newProfile);
    
    // Initial log
    const initialLog: WeightLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        weight: newProfile.currentWeight
    };
    const newLogs = [initialLog];
    saveLogs(newLogs);
    setLogs(newLogs);
    
    // Open settings to create first plan immediately after onboarding? 
    // Or let them explore. Let's let them explore, dashboard will prompt "Create Plan".
  };

  const handleAddLog = (weight: number) => {
    const newLog: WeightLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        weight
    };
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    saveLogs(updatedLogs);

    if (profile) {
        const updatedProfile = { ...profile, currentWeight: weight };
        setProfile(updatedProfile);
        saveProfile(updatedProfile);
    }
  };

  const handleUpdateLog = (updatedLog: WeightLog) => {
      const existingLogIndex = logs.findIndex(l => l.id === updatedLog.id);
      let newLogs = [...logs];
      
      if (existingLogIndex >= 0) {
          newLogs[existingLogIndex] = updatedLog;
      } else {
          const duplicateDateIndex = logs.findIndex(l => isSameDay(new Date(l.date), new Date(updatedLog.date)));
          if (duplicateDateIndex >= 0) {
              newLogs[duplicateDateIndex] = { ...updatedLog, id: logs[duplicateDateIndex].id };
          } else {
              newLogs.push(updatedLog);
          }
      }

      setLogs(newLogs);
      saveLogs(newLogs);

      const sortedLogs = [...newLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sortedLogs.length > 0 && profile) {
           const latest = sortedLogs[0];
           if (isSameDay(new Date(latest.date), new Date(updatedLog.date))) {
                const updatedProfile = { ...profile, currentWeight: latest.weight };
                setProfile(updatedProfile);
                saveProfile(updatedProfile);
           }
      }
  };

  const handleDeleteLog = (id: string) => {
      const newLogs = logs.filter(l => l.id !== id);
      setLogs(newLogs);
      saveLogs(newLogs);
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
  };
  
  const handleSelectPlan = (planId: string) => {
      if (!profile) return;
      const updatedPlans = profile.plans.map(p => ({
          ...p,
          isActive: p.id === planId
      }));
      const updatedProfile = { ...profile, plans: updatedPlans };
      handleUpdateProfile(updatedProfile);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center">
      <header className="w-full max-w-4xl p-6 flex justify-between items-center z-10">
        <Logo />
        <div className="flex items-center gap-4">
            <ThemeToggle />
        </div>
      </header>

      <main className="w-full flex-1 flex flex-col">
        {!profile ? (
            <div className="flex-1 flex flex-col justify-center items-center">
                 <Onboarding onComplete={handleOnboardingComplete} />
            </div>
        ) : (
            <Dashboard 
                logs={logs} 
                profile={profile} 
                metrics={metrics}
                activePlan={activePlan}
                onAddLog={handleAddLog}
                onUpdateLog={handleUpdateLog}
                onDeleteLog={handleDeleteLog}
                onOpenSettings={() => setShowSettings(true)}
                onSelectPlan={handleSelectPlan}
            />
        )}
      </main>

      {showSettings && profile && (
        <GoalSettings 
            currentProfile={profile} 
            onSave={handleUpdateProfile} 
            onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default App;