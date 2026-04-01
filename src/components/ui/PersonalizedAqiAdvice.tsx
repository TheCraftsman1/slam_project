import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, CheckCircle, ShieldCheck, ChevronDown, ChevronUp, Wind, HeartPulse, Activity } from 'lucide-react';
import { useUserProfile } from '../../hooks';

interface Props {
  aqi: number;
}

export function PersonalizedAqiAdvice({ aqi }: Props) {
  const { profile, riskCategory } = useUserProfile();
  const [expanded, setExpanded] = useState(false);

  const getAdviceDetails = () => {
    const isAsthma = profile.conditions.includes('Asthma');
    const isHeart = profile.conditions.includes('Heart conditions');
    const isActive = profile.activityLevel === 'Active';
    const isOutdoorsy = profile.exposure === '3+ hours';
    const isVulnerable = profile.ageGroup === 'Child' || profile.ageGroup === 'Senior';
    
    let config = {
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-card border-border-subtle',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      icon: <ShieldCheck size={20} />,
      emoji: '🌿',
      title: 'Optimal Conditions',
      message: '',
      details: [] as string[]
    };

    if (aqi <= 50) {
      config.title = isVulnerable ? 'Safe for your age group' : 'Perfect for your routine';
      config.message = isOutdoorsy 
        ? `With an AQI of ${aqi}, it's an ideal day for your 3+ hour outdoor routine.` 
        : `An ideal day for your ${profile.activityLevel.toLowerCase()} routine. Feel free to head outside.`;
      config.details = [
        isAsthma ? 'Your respiratory system is completely safe from triggers today.' : 'Optimal air quality for cardiovascular health.',
        isActive ? 'Great conditions for high-intensity workouts and deep breathing.' : 'Perfect for a refreshing outdoor walk.',
        'No particulate matter threats present today.'
      ];
    } else if (aqi <= 100) {
      if (riskCategory === 'High Risk') {
        config.color = 'text-amber-600 dark:text-amber-400';
        config.iconBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
        config.icon = <AlertTriangle size={20} />;
        config.emoji = '😷';
        config.title = isAsthma ? 'Asthma Caution' : 'High Sensitivity Alert';
        config.message = `As someone with ${isAsthma ? 'asthma' : 'high sensitivity'}, you should limit intense outdoor activities today.`;
        config.details = [
          isHeart ? 'Your cardiovascular system may have to work harder today.' : 'Slight increase in PM2.5 could cause minor irritation.',
          isOutdoorsy ? 'Try to cut your 3+ hour outdoor time down significantly.' : 'Keep your rescue inhaler or medication nearby just in case.',
          'Consider shifting heavy workouts indoors.'
        ];
      } else {
        config.title = 'Acceptable Quality';
        config.message = `Air quality is acceptable for your ${riskCategory.toLowerCase()} profile.`;
        config.details = [
          isVulnerable ? 'Seniors and children should still stay hydrated.' : 'Minimal risk for healthy individuals.',
          isActive ? 'You can proceed with your active routine as normal.' : 'Safe for your daily outdoor exposure.',
          'Pollutants are within legal safety limits.'
        ];
      }
    } else if (aqi <= 150) {
      config.color = riskCategory === 'High Risk' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400';
      config.iconBg = riskCategory === 'High Risk' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      config.icon = riskCategory === 'High Risk' ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />;
      config.emoji = riskCategory === 'High Risk' ? '🛑' : '⚠️';
      config.title = riskCategory === 'High Risk' ? 'Direct Health Risk' : 'Moderate Exposure Alert';
      
      config.message = riskCategory === 'High Risk' 
        ? `Skip your ${profile.activityLevel.toLowerCase()} outdoor routine completely. High risk of ${isHeart? 'cardiac stress' : 'breathing issues'}.`
        : `Limit your ${profile.exposure} outdoor exposure. You may experience some discomfort.`;
      
      config.details = [
        isAsthma ? 'High PM2.5 strongly aggravates asthmatic airways.' : 'Avoid major exertion and prolonged exposure.',
        isOutdoorsy ? 'Your usual 3+ hours outdoors is not advised today.' : 'Keep your daily outings shorter than usual.',
        riskCategory === 'High Risk' ? 'Opt for indoor activities and wear an N95 if commuting.' : 'Sensitive individuals will typically feel respiratory symptoms.'
      ];
    } else {
       config.color = 'text-red-600 dark:text-red-400';
       config.iconBg = 'bg-red-500/10 text-red-600 dark:text-red-400';
       config.icon = <ShieldAlert size={20} />;
       config.emoji = '☢️';
       config.title = isHeart ? 'Cardiac Danger Zone' : 'Severe Health Risk';
       
       config.message = `Stop all outdoor activities immediately. The AQI of ${aqi} poses a severe risk to your health.`;
       config.details = [
         isVulnerable ? 'Extremely dangerous for your age group to be outdoors.' : 'Particulates are dense enough to enter the bloodstream directly.',
         isActive ? 'Under no circumstances should you engage in active physical exertion.' : 'Even sedentary exposure is dangerous right now.',
         isHeart ? 'Your heart condition puts you at severe medical risk in this air.' : 'Keep all windows closed and run an air purifier.'
       ];
    }
    
    return config;
  };

  const advice = getAdviceDetails();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-md bg-card border border-border-subtle rounded-[24px] p-5 flex flex-col mb-6 shadow-sm relative overflow-hidden transition-all duration-300`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 flex flex-col items-center justify-center p-2.5 rounded-2xl ${advice.iconBg} shadow-minimal border border-black/5 dark:border-white/5`}>
          {advice.icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-[15px] font-bold ${advice.color} font-display mb-1.5 flex items-center gap-2`}>
            <span>{advice.emoji}</span>
            {advice.title}
          </h3>
          <p className="text-[13.5px] leading-relaxed text-text-main opacity-90 font-medium">
            {advice.message}
          </p>
          
          <div className="mt-3 flex items-center gap-2">
            <span className="bg-surface/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] uppercase tracking-[0.1em] font-extrabold text-text-sub border border-border-subtle shrink-0">
              {riskCategory}
            </span>
          </div>
        </div>
      </div>

      {/* Learn Why Button */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className={`mt-4 flex items-center justify-between w-full p-3 rounded-2xl transition-all active:scale-[0.98] border ${
          expanded ? 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10' : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        <span className={`text-[12px] font-bold tracking-wide flex items-center gap-2 ${advice.color}`}>
          <HeartPulse size={14} />
          Learn why this affects you
        </span>
        {expanded ? <ChevronUp size={16} className={advice.color} /> : <ChevronDown size={16} className={advice.color} />}
      </button>

      {/* Expanded Modal Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-black/5 dark:border-white/5 mt-2 space-y-3">
              <p className="text-[12px] font-bold text-text-sub uppercase tracking-wider mb-2">Personalized Impact</p>
              {advice.details.map((detail, idx) => (
                <div key={idx} className="flex gap-3 text-text-main/80 text-[13px] items-start p-2.5 bg-black/5 dark:bg-white/5 rounded-xl">
                  <Activity size={16} className={`shrink-0 mt-0.5 ${advice.color}`} />
                  <span className="leading-relaxed font-medium">{detail}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}