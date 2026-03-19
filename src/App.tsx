import { useState } from 'react';
import { Home, Map as MapIcon, Mic, User, Home as HomeIndoor, Sparkles } from 'lucide-react';
import { HomeScreen } from './components/HomeScreen';
import { MapScreen } from './components/MapScreen';
import { AssistantScreen } from './components/AssistantScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { IndoorScreen } from './components/IndoorScreen';
import { motion, AnimatePresence } from 'motion/react';
import { ToastProvider, ErrorBoundary, OfflineBanner } from './components/ui';
import { useOnlineStatus } from './hooks';

type TabItem = {
  id: string;
  label: string;
  Icon: typeof Home;
  isCenter?: boolean;
};

const tabs: TabItem[] = [
  { id: 'home', label: 'Outdoor', Icon: Home },
  { id: 'indoor', label: 'Indoor', Icon: HomeIndoor },
  { id: 'assistant', label: '', Icon: Mic, isCenter: true },
  { id: 'map', label: 'Map', Icon: MapIcon },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [prevTab, setPrevTab] = useState<string>('home');
  const { isOnline } = useOnlineStatus();

  const handleTabChange = (tab: string) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="h-screen w-full bg-[#0b1120] text-white overflow-hidden flex flex-col font-display">
          {/* Offline Banner */}
          <AnimatePresence>
            <OfflineBanner isOnline={isOnline} />
          </AnimatePresence>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="absolute inset-0 overflow-y-auto"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {activeTab === 'home' && <HomeScreen />}
                {activeTab === 'indoor' && <IndoorScreen />}
                {activeTab === 'map' && <MapScreen />}
                {activeTab === 'assistant' && <AssistantScreen />}
                {activeTab === 'profile' && <ProfileScreen />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Navigation - Premium Glass Bar */}
          <div className="relative z-50">
            {/* Gradient fade above nav */}
            <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#0b1120] to-transparent pointer-events-none" />

            <nav className="bg-[#0f1729]/90 backdrop-blur-2xl border-t border-white/[0.06] px-4 pb-7 pt-3">
              <div className="flex items-center justify-around max-w-md mx-auto relative">
                {tabs.map(({ id, label, Icon, isCenter }) => {
                  const isActive = activeTab === id;

                  if (isCenter) {
                    return (
                      <div key={id} className="relative -mt-8">
                        <button
                          onClick={() => handleTabChange(id)}
                          className="relative group"
                        >
                          {/* Glow effect */}
                          <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-300 ${isActive ? 'bg-blue-500/40 scale-150' : 'bg-blue-500/20 scale-100'}`} />

                          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_30px_rgba(59,130,246,0.5)]'
                              : 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                          } border-4 border-[#0f1729] active:scale-90`}>
                            {isActive ? (
                              <Sparkles size={28} className="text-white" />
                            ) : (
                              <Icon size={28} className="text-white" />
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={id}
                      onClick={() => handleTabChange(id)}
                      className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 active:scale-90"
                    >
                      <div className="relative">
                        <Icon
                          size={22}
                          className={`transition-colors duration-200 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}
                          strokeWidth={isActive ? 2.5 : 1.8}
                        />
                        {isActive && (
                          <motion.div
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400"
                            layoutId="navDot"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                      </div>
                      <span className={`text-[10px] font-bold transition-colors duration-200 ${isActive ? 'text-blue-400' : 'text-slate-600'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}
