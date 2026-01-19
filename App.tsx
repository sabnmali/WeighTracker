import React, { useState, useEffect } from 'react';
import Logo from './components/ui/Logo';
import ThemeToggle from './components/ui/ThemeToggle';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import GoalSettings from './components/GoalSettings';
import { getProfile, saveProfile, getLogs, saveLogs } from './services/storage';
import { calculateDeficit } from './services/calculator';
import { UserProfile, WeightLog, CalculationResult } from './types';
import { Settings } from 'lucide-react';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [metrics, setMetrics] = useState<CalculationResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    const savedProfile = getProfile();
    const savedLogs = getLogs();
    
    if (savedProfile) setProfile(savedProfile);
    if (savedLogs) setLogs(savedLogs);
    
    setLoading(false);
  }, []);

  // Update metrics whenever profile or logs change
  useEffect(() => {
    if (profile) {
        // If we have logs, update current weight in profile implicitly for calculation context if desired,
        // but typically profile.currentWeight is the "anchor". 
        // For dynamic calculator, we should use the LATEST log weight as current weight.
        const latestLog = logs.length > 0 
            ? logs.reduce((prev, current) => (new Date(prev.date) > new Date(current.date) ? prev : current))
            : null;

        const effectiveProfile = latestLog 
            ? { ...profile, currentWeight: latestLog.weight }
            : profile;

        const result = calculateDeficit(effectiveProfile);
        setMetrics(result);
    }
  }, [profile, logs]);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
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

    // Also update profile current weight
    if (profile) {
        const updatedProfile = { ...profile, currentWeight: weight };
        setProfile(updatedProfile);
        saveProfile(updatedProfile);
    }
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
  };

  if (loading) return null; // Or a spinner

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-4xl p-6 flex justify-between items-center z-10">
        <Logo />
        <div className="flex items-center gap-4">
            {profile && (
                <button 
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-slate-500 hover:text-blue-500 transition-colors"
                >
                    <Settings size={24} />
                </button>
            )}
            <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
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
                onAddLog={handleAddLog}
            />
        )}
      </main>

      {/* Settings Modal */}
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