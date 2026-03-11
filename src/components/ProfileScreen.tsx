import { useState, useEffect } from 'react';
import { Menu, Bell, Check, Bus, Thermometer, Ban, Leaf, Wind, Globe, Trophy, Flame, Target, Star, ChevronRight, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Challenge {
  id: string;
  title: string;
  icon: any;
  completed: boolean;
  points: number;
}

interface Achievement {
  id: string;
  title: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  earned: boolean;
}

export function ProfileScreen() {
  const [streak, setStreak] = useState(14);
  const [totalPoints, setTotalPoints] = useState(2840);
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: '1', title: 'Take public transit', icon: Bus, completed: true, points: 50 },
    { id: '2', title: 'Keep AC above 24°C', icon: Thermometer, completed: true, points: 30 },
    { id: '3', title: 'Avoid outdoor exercise', icon: Ban, completed: false, points: 40 },
  ]);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const achievements: Achievement[] = [
    { id: '1', title: 'Bronze Leaf', icon: Leaf, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20', earned: true },
    { id: '2', title: 'Silver Lungs', icon: Wind, color: 'text-slate-300', bgColor: 'bg-slate-400/10', borderColor: 'border-slate-400/20', earned: true },
    { id: '3', title: 'Gold Globe', icon: Globe, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', earned: true },
    { id: '4', title: 'Eco Warrior', icon: Award, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20', earned: false },
    { id: '5', title: 'Clean Air Hero', icon: Star, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', earned: false },
    { id: '6', title: 'Planet Saver', icon: Globe, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', earned: false },
  ];

  const toggleChallenge = (id: string) => {
    setChallenges(prev => prev.map(c => {
      if (c.id === id) {
        const newCompleted = !c.completed;
        if (newCompleted) setTotalPoints(p => p + c.points);
        else setTotalPoints(p => p - c.points);
        return { ...c, completed: newCompleted };
      }
      return c;
    }));
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const progressPercent = (completedCount / challenges.length) * 100;

  return (
    <div className="min-h-full bg-[#0b1120] text-white flex flex-col px-5 pt-6 pb-32 font-display relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-15%] w-[50%] h-[40%] bg-green-500/[0.05] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[30%] bg-blue-500/[0.04] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <motion.div className="flex items-center justify-between mb-6 z-10" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.08] active:scale-95 transition-transform">
          <Menu size={20} className="text-slate-300" />
        </button>
        <h2 className="text-lg font-bold">Profile</h2>
        <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.08] relative active:scale-95 transition-transform">
          <Bell size={20} className="text-slate-300" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-[#0b1120]" />
        </button>
      </motion.div>

      {/* Profile Card */}
      <motion.div className="glass-card rounded-3xl p-6 mb-5 z-10" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-green-500/30">
              <img
                alt="Profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAISKJKUDOhGRkg06Wszn-VM4UZ5FjStAB60fNl6_8JfkACdX_it0geTMYrCWN5U5i9KnER36XnOLfKN_KjExPjmq5fTB9hC3Hgxg191DW5OnaLUITYtJsHmP8mVkn9N4vSMb53_3PULKRVEVPLqCQjNol0ohLzGEnRiUjx5Wd2APRmQDkhom3RgJPjRhfA1Ygw289Xno5FG2rRp0jhJb9MbmI9pINDPKUIfzcVbPnUs5ZZt3TRLn3Mc6O1BDIA1JMMcVOTXknBP1g"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-lg ring-2 ring-[#0b1120]">
              <Check size={10} strokeWidth={4} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">Alex Green</h3>
            <p className="text-green-400 text-sm font-semibold">Sustainability Enthusiast</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Trophy size={12} className="text-yellow-400" />
                <span className="font-bold text-white tabular-nums">{totalPoints}</span> pts
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Target size={12} className="text-blue-400" />
                <span className="font-bold text-white">Rank #42</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Streak Card */}
      <motion.div
        className="glass-card border-green-500/20 rounded-3xl p-5 mb-5 z-10 overflow-hidden relative"
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/[0.08] rounded-full blur-[60px] -translate-y-1/2 translate-x-1/4" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-green-400 text-[10px] font-bold uppercase tracking-[0.2em] block mb-1">Current Streak</span>
            <div className="flex items-center gap-2">
              <motion.span
                className="text-4xl font-black tabular-nums"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
              >
                {streak}
              </motion.span>
              <span className="text-lg font-bold text-slate-400">Days</span>
              <Flame size={24} className="text-orange-400" />
            </div>
            <p className="text-green-400/60 text-xs mt-1 font-medium">Top 5% of users this month</p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={`w-2 h-8 rounded-full ${i < 5 ? 'bg-green-500' : 'bg-white/10'}`}
                style={{ height: `${20 + i * 5}px` }} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Today's Challenges */}
      <motion.div
        className="glass-card rounded-3xl p-5 mb-5 z-10"
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold">Today's Challenges</h3>
          <span className="text-[10px] bg-green-500/15 text-green-400 px-2.5 py-1 rounded-full font-bold">{completedCount}/{challenges.length}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>

        <div className="space-y-3">
          {challenges.map(challenge => (
            <motion.button
              key={challenge.id}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.03] transition-colors active:scale-[0.98]"
              onClick={() => toggleChallenge(challenge.id)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center h-7 w-7 rounded-lg border-2 transition-all ${
                  challenge.completed
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-slate-600 text-transparent hover:border-slate-400'
                }`}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className={`font-medium text-sm ${challenge.completed ? 'text-slate-400' : 'text-white'}`}>
                  {challenge.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500">+{challenge.points} pts</span>
                <challenge.icon size={16} className="text-slate-600" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div className="z-10" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold">Achievements</h3>
          <button onClick={() => setShowAllAchievements(!showAllAchievements)} className="flex items-center gap-1 text-blue-400 text-xs font-bold active:scale-95 transition-transform">
            {showAllAchievements ? 'Show Less' : 'View All'}
            <ChevronRight size={14} className={`transition-transform ${showAllAchievements ? 'rotate-90' : ''}`} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(showAllAchievements ? achievements : achievements.slice(0, 3)).map((a, i) => (
            <motion.div
              key={a.id}
              className={`flex flex-col items-center gap-2 p-4 glass-card ${a.borderColor} rounded-2xl ${!a.earned ? 'opacity-40' : ''}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: a.earned ? 1 : 0.4 }}
              transition={{ delay: 0.5 + i * 0.08 }}
            >
              <div className={`w-14 h-14 rounded-2xl ${a.bgColor} flex items-center justify-center border ${a.borderColor}`}>
                <a.icon className={a.color} size={22} />
              </div>
              <span className="text-[10px] font-bold text-center uppercase text-slate-500">{a.title}</span>
              {!a.earned && <span className="text-[8px] text-slate-600 font-medium">Locked</span>}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        className="glass-card rounded-3xl p-5 mt-5 z-10"
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
      >
        <h3 className="text-base font-bold mb-4">Impact Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <span className="text-2xl font-black text-green-400 tabular-nums">12.5</span>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">kg CO₂ Saved</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black text-blue-400 tabular-nums">48</span>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Tasks Done</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black text-purple-400 tabular-nums">3</span>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Badges Earned</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
