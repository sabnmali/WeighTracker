import { ActivityLevel } from './types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.Sedentary]: 1.2,
  [ActivityLevel.Light]: 1.375,
  [ActivityLevel.Moderate]: 1.55,
  [ActivityLevel.Very]: 1.725,
  [ActivityLevel.Extra]: 1.9,
};

export const CALORIES_PER_KG_FAT = 7700;
export const MAX_SAFE_WEEKLY_LOSS_KG = 1.0; // General safe guideline