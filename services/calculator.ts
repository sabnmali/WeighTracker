import { differenceInDays, parseISO } from 'date-fns';
import { ACTIVITY_MULTIPLIERS, CALORIES_PER_KG_FAT, MAX_SAFE_WEEKLY_LOSS_KG } from '../constants';
import { UserProfile, CalculationResult, Gender } from '../types';

export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number => {
  // Mifflin-St Jeor Equation
  const s = gender === Gender.Male ? 5 : -161;
  return 10 * weight + 6.25 * height - 5 * age + s;
};

export const calculateTDEE = (bmr: number, activityLevel: UserProfile['activityLevel']): number => {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
};

export const calculateDeficit = (profile: UserProfile): CalculationResult | null => {
  if (!profile.targetWeight || !profile.targetDate) return null;

  const bmr = calculateBMR(profile.currentWeight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  const today = new Date();
  const targetDate = parseISO(profile.targetDate);
  const daysRemaining = differenceInDays(targetDate, today);

  if (daysRemaining <= 0) {
     return {
        bmr,
        tdee,
        weeklyLossRequired: 0,
        dailyDeficitRequired: 0,
        dailyCalorieTarget: tdee,
        isRealistic: true,
        daysRemaining: 0
     }
  }

  const totalWeightLossNeeded = profile.currentWeight - profile.targetWeight;
  const totalCaloriesToBurn = totalWeightLossNeeded * CALORIES_PER_KG_FAT;
  
  // If user wants to gain weight, logic flips, but spec focuses on loss/deficit. 
  // Handling negative deficit (surplus) for gain implicitly.
  
  const dailyDeficitRequired = totalCaloriesToBurn / daysRemaining;
  const dailyCalorieTarget = tdee - dailyDeficitRequired;

  const weeksRemaining = daysRemaining / 7;
  const weeklyLossRequired = totalWeightLossNeeded / weeksRemaining;

  // Realistic check: Warning if > 1kg/week loss is needed or if calories drop dangerously low (<1200 for women, <1500 for men roughly, but simplified here)
  const isRealistic = weeklyLossRequired <= MAX_SAFE_WEEKLY_LOSS_KG && dailyCalorieTarget > 1000;

  return {
    bmr,
    tdee,
    weeklyLossRequired,
    dailyDeficitRequired,
    dailyCalorieTarget,
    isRealistic,
    daysRemaining,
  };
};