import { useState, type ReactNode } from 'react';
import { Bell, Shield, Sparkles, Volume2, Moon, Sun, Monitor, Activity, UserCircle, Wind, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from './ui/ThemeProvider';
import { useUserProfile } from '../hooks';
import type { AgeGroup, ActivityLevel, HealthCondition, ExposurePattern, Sensitivity } from '../types';

type StartScreen = 'Outdoor' | 'Map' | 'Ask';
type ThemeOption = 'light' | 'dark' | 'system';

export function ProfileScreen() {
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile, riskCategory } = useUserProfile();
  
  const [startScreen, setStartScreen] = useState<StartScreen>('Outdoor');
  const [morningBrief, setMorningBrief] = useState(true);
  const [voiceReplies, setVoiceReplies] = useState(false);

  const toggleCondition = (condition: HealthCondition) => {
    let newConditions = [...profile.conditions];
    if (condition === 'None') {
      newConditions = ['None'];
    } else {
      newConditions = newConditions.filter(c => c !== 'None');
      if (newConditions.includes(condition)) {
        newConditions = newConditions.filter(c => c !== condition);
        if (newConditions.length === 0) newConditions = ['None'];
      } else {
        newConditions.push(condition);
      }
    }
    updateProfile({ conditions: newConditions });
  };

  return (
    <div className="min-h-full bg-surface px-5 pt-8 pb-32 text-text-main">
      <div className="mx-auto flex max-w-md flex-col gap-5">

        {/* ── Header ── */}
        <motion.header
          className="flex items-start justify-between gap-3"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/80 font-display">Profile</p>
            <h1 className="mt-1.5 text-[28px] font-bold tracking-tight font-display">Preferences</h1>
          </div>
        </motion.header>

        {/* ── Info Card ── */}
        <motion.section
          className="rounded-[28px] bg-card border border-border-subtle p-6 shadow-minimal relative overflow-hidden"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
        >
          <div className="relative flex items-start gap-4">
            <div className="rounded-2xl bg-accent/10 p-3 border border-accent/20">
              <Shield size={22} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-text-main font-display">Make alerts fit you</p>
              <p className="mt-2 text-[13px] leading-relaxed text-text-sub">
                Only the settings that matter on mobile — kept tight and focused.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Appearance (Theme) ── */}
        <motion.section
          className="rounded-[22px] bg-card border border-border-subtle p-4 shadow-sm"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-sub">Appearance</p>
          <div className="mt-3 flex gap-2">
            {[
              { id: 'light', icon: <Sun size={14} />, label: 'Light' },
              { id: 'dark', icon: <Moon size={14} />, label: 'Dark' },
              { id: 'system', icon: <Monitor size={14} />, label: 'System' }
            ].map((option) => {
              const isActive = theme === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id as ThemeOption)}
                  className={`flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border py-3 transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'border-accent bg-accent/10 text-text-main shadow-minimal'
                      : 'border-border-subtle bg-surface text-text-sub hover:bg-border-subtle hover:text-text-main'
                  }`}
                >
                  {option.icon}
                  <span className="text-[11px] font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* ── Health & Lifestyle Profile ── */}
        <motion.section
          className="rounded-[22px] bg-card border border-border-subtle p-5 shadow-sm space-y-6"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <UserCircle size={18} className="text-accent" />
              Personal Profile
            </h2>
            <span className="bg-accent/10 text-accent px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
              {riskCategory}
            </span>
          </div>

          {/* Age Group */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-sub mb-3">Age Group</p>
            <div className="flex flex-wrap gap-2">
              {(['Child', 'Teen', 'Adult', 'Senior'] as AgeGroup[]).map((option) => (
                <button
                  key={option}
                  onClick={() => updateProfile({ ageGroup: option })}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-all duration-200 active:scale-95 ${
                    profile.ageGroup === option
                      ? 'border-accent bg-accent/10 text-text-main shadow-minimal'
                      : 'border-border-subtle bg-surface text-text-sub hover:bg-border-subtle'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Health Conditions */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-sub mb-3">Health Conditions</p>
            <div className="flex flex-wrap gap-2">
              {(['Asthma', 'Breathing issues', 'Heart conditions', 'Allergies', 'None'] as HealthCondition[]).map((option) => (
                <button
                  key={option}
                  onClick={() => toggleCondition(option)}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-all duration-200 active:scale-95 ${
                    profile.conditions.includes(option)
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-minimal'
                      : 'border-border-subtle bg-surface text-text-sub hover:bg-border-subtle'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-sub mb-3">Outdoor Activity Level</p>
            <div className="flex flex-wrap gap-2">
              {(['Sedentary', 'Moderate', 'Active'] as ActivityLevel[]).map((option) => (
                <button
                  key={option}
                  onClick={() => updateProfile({ activityLevel: option })}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-all duration-200 active:scale-95 flex items-center gap-1 ${
                    profile.activityLevel === option
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-minimal'
                      : 'border-border-subtle bg-surface text-text-sub hover:bg-border-subtle'
                  }`}
                >
                  <Activity size={12} />
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Outdoor Exposure */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-sub mb-3">Daily Time Outdoors</p>
            <div className="flex flex-wrap gap-2">
              {(['< 1 hour', '1-3 hours', '3+ hours'] as ExposurePattern[]).map((option) => (
                <button
                  key={option}
                  onClick={() => updateProfile({ exposure: option })}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-all duration-200 active:scale-95 flex items-center gap-1 ${
                    profile.exposure === option
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-minimal'
                      : 'border-border-subtle bg-surface text-text-sub hover:bg-border-subtle'
                  }`}
                >
                  <Clock size={12} />
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Sensitivity */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-sub mb-3 flex items-center gap-1">
              Self-Reported Sensitivity
            </p>
            <div className="flex flex-wrap gap-2">
              {(['Low', 'Medium', 'High'] as Sensitivity[]).map((option) => (
                <button
                  key={option}
                  onClick={() => updateProfile({ sensitivity: option })}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-all duration-200 active:scale-95 ${
                    profile.sensitivity === option
                      ? 'border-accent bg-accent/10 text-text-main shadow-minimal'
                      : 'border-border-subtle bg-surface text-text-sub hover:bg-border-subtle'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Start Screen ── */}
        <motion.section
          className="rounded-[22px] bg-card border border-border-subtle p-4 shadow-sm"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-sub">Start screen</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['Outdoor', 'Map', 'Ask'] as StartScreen[]).map((option) => {
              const isActive = startScreen === option;
              return (
                <button
                  key={option}
                  onClick={() => setStartScreen(option)}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'border-accent bg-accent/10 text-text-main shadow-minimal'
                      : 'border-border-subtle bg-surface text-text-sub hover:bg-border-subtle hover:text-text-main'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* ── Toggle Cards ── */}
        <motion.section
          className="grid grid-cols-2 gap-3"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
        >
          <ToggleCard
            title="Morning brief"
            value={morningBrief ? 'On' : 'Off'}
            icon={<Bell size={14} className="text-accent" />}
            onClick={() => setMorningBrief((v) => !v)}
            active={morningBrief}
          />
          <ToggleCard
            title="Voice replies"
            value={voiceReplies ? 'On' : 'Off'}
            icon={<Volume2 size={14} className="text-accent" />}
            onClick={() => setVoiceReplies((v) => !v)}
            active={voiceReplies}
          />
        </motion.section>

        {/* ── Note Card ── */}
        <motion.section
          className="rounded-[22px] bg-card border border-border-subtle p-4 shadow-sm"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <p className="text-[13px] font-bold text-text-main">No fake streaks here</p>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-text-sub">
            Progress cards stay hidden until you have real synced profile data.
          </p>
        </motion.section>

        {/* ── App Info ── */}
        <motion.div
          className="text-center pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-[10px] text-text-sub font-medium opacity-60">EcoSense v2.0 • Premium Design</p>
        </motion.div>
      </div>
    </div>
  );
}

function ToggleCard({
  title,
  value,
  icon,
  onClick,
  active,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[20px] bg-card border border-border-subtle hover:bg-border-subtle p-4 text-left shadow-sm transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-sub">{title}</p>
      </div>
      <p className={`mt-2.5 text-[15px] font-bold ${active ? 'text-text-main' : 'text-text-sub'}`}>{value}</p>
    </button>
  );
}
