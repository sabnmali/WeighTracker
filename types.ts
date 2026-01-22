export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export enum ActivityLevel {
  Sedentary = 'Sedentary', // Little or no exercise
  Light = 'Lightly Active', // Light exercise 1-3 days/week
  Moderate = 'Moderately Active', // Moderate exercise 3-5 days/week
  Very = 'Very Active', // Hard exercise 6-7 days/week
  Extra = 'Extra Active', // Very hard exercise & physical job
}

export interface UserProfile {
  height: number; // cm
  currentWeight: number; // kg
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  targetWeight?: number; // kg
  targetDate?: string; // ISO date string
}

export interface WeightLog {
  id: string;
  date: string; // ISO date string
  weight: number; // kg
}

export interface CalculationResult {
  bmr: number;
  tdee: number;
  weeklyLossRequired: number; // kg
  dailyDeficitRequired: number; // kcal
  dailyCalorieTarget: number; // kcal
  isRealistic: boolean;
  daysRemaining: number;
  planMode: 'loss' | 'gain' | 'maintain';
}