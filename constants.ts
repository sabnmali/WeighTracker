import { ActivityLevel } from './types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.Sedentary]: 1.2,
  [ActivityLevel.Light]: 1.375,
  [ActivityLevel.Moderate]: 1.55,
  [ActivityLevel.Very]: 1.725,
  [ActivityLevel.Extra]: 1.9,
};

export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  [ActivityLevel.Sedentary]: "Little or no exercise, desk job",
  [ActivityLevel.Light]: "Light exercise or sports 1-3 days/week",
  [ActivityLevel.Moderate]: "Moderate exercise or sports 3-5 days/week",
  [ActivityLevel.Very]: "Hard exercise or sports 6-7 days/week",
  [ActivityLevel.Extra]: "Very hard exercise, physical job, or training 2x/day",
};

export const CALORIES_PER_KG_FAT = 7700;
export const MAX_SAFE_WEEKLY_LOSS_KG = 1.0; // General safe guideline