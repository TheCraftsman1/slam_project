export type AgeGroup = 'Child' | 'Teen' | 'Adult' | 'Senior';
export type ActivityLevel = 'Sedentary' | 'Moderate' | 'Active';
export type HealthCondition = 'Asthma' | 'Breathing issues' | 'Heart conditions' | 'Allergies' | 'None';
export type ExposurePattern = '< 1 hour' | '1-3 hours' | '3+ hours';
export type Sensitivity = 'Low' | 'Medium' | 'High';
export type RiskCategory = 'Low Risk' | 'Moderate Risk' | 'High Risk';

export interface UserProfile {
  ageGroup: AgeGroup;
  activityLevel: ActivityLevel;
  conditions: HealthCondition[];
  exposure: ExposurePattern;
  sensitivity: Sensitivity;
}
