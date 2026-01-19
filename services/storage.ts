import { UserProfile, WeightLog } from '../types';

const PROFILE_KEY = 'wt_profile';
const LOGS_KEY = 'wt_logs';

export const saveProfile = (profile: UserProfile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getProfile = (): UserProfile | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveLogs = (logs: WeightLog[]): void => {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

export const getLogs = (): WeightLog[] => {
  const data = localStorage.getItem(LOGS_KEY);
  return data ? JSON.parse(data) : [];
};