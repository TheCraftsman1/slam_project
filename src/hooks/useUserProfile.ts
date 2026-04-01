import { useState, useEffect } from 'react';
import type { UserProfile, RiskCategory } from '../types';

const DEFAULT_PROFILE: UserProfile = {
  ageGroup: 'Adult',
  activityLevel: 'Moderate',
  conditions: ['None'],
  exposure: '1-3 hours',
  sensitivity: 'Low',
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('cleanair_user_profile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse user profile', e);
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem('cleanair_user_profile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const getRiskCategory = (): RiskCategory => {
    const hasHighRiskCondition = profile.conditions.some(c => 
      ['Asthma', 'Breathing issues', 'Heart conditions'].includes(c)
    );
    
    if (hasHighRiskCondition || profile.sensitivity === 'High') {
      return 'High Risk';
    }
    if (profile.sensitivity === 'Medium' || profile.exposure === '3+ hours') {
      return 'Moderate Risk';
    }
    return 'Low Risk';
  };

  return {
    profile,
    updateProfile,
    riskCategory: getRiskCategory(),
  };
}
