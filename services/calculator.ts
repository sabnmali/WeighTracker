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

  let planMode: 'loss' | 'gain' | 'maintain' = 'maintain';
  if (profile.targetWeight < profile.currentWeight) planMode = 'loss';
  if (profile.targetWeight > profile.currentWeight) planMode = 'gain';

  if (daysRemaining <= 0 || planMode === 'maintain') {
     return {
        bmr,
        tdee,
        weeklyLossRequired: 0,
        dailyDeficitRequired: 0,
        dailyCalorieTarget: tdee,
        isRealistic: true,
        daysRemaining: 0,
        planMode
     }
  }

  // Calculate total change needed (absolute value for math, direction handled by mode)
  const totalWeightChangeNeeded = Math.abs(profile.currentWeight - profile.targetWeight);
  const totalCaloriesChange = totalWeightChangeNeeded * CALORIES_PER_KG_FAT;
  
  const dailyChangeRequired = totalCaloriesChange / daysRemaining;
  
  // If Loss: Target = TDEE - Deficit
  // If Gain: Target = TDEE + Surplus
  const dailyCalorieTarget = planMode === 'loss' 
    ? tdee - dailyChangeRequired 
    : tdee + dailyChangeRequired;

  const weeksRemaining = daysRemaining / 7;
  const weeklyChangeRequired = totalWeightChangeNeeded / weeksRemaining;

  // Realistic check
  // Loss: > 1kg/week is aggressive. Calorie target < BMR is usually unsafe.
  // Gain: > 0.5-1kg/week is often fat rather than muscle.
  let isRealistic = true;
  if (planMode === 'loss') {
      isRealistic = weeklyChangeRequired <= MAX_SAFE_WEEKLY_LOSS_KG && dailyCalorieTarget > 1200;
  } else if (planMode === 'gain') {
      isRealistic = weeklyChangeRequired <= MAX_SAFE_WEEKLY_LOSS_KG; // Using same max metric for simplicity
  }

  return {
    bmr,
    tdee,
    weeklyLossRequired: weeklyChangeRequired, // naming kept consistent with type, represents "change"
    dailyDeficitRequired: dailyChangeRequired, // represents magnitude of deficit or surplus
    dailyCalorieTarget,
    isRealistic,
    daysRemaining,
    planMode
  };
};