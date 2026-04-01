import { useState } from 'react';
import { Home, Map as MapIcon, MessageSquare, User, Home as HomeIndoor } from 'lucide-react';
import { HomeScreen } from './components/HomeScreen';
import { MapScreen } from './components/MapScreen';
import { AssistantScreen } from './components/AssistantScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { IndoorScreen } from './components/IndoorScreen';
import { motion, AnimatePresence } from 'motion/react';
import { ToastProvider, ErrorBoundary, OfflineBanner } from './components/ui';
import { ThemeProvider } from './components/ui/ThemeProvider';
import { useOnlineStatus, AqiProvider } from './hooks';

import { LocationDetailScreen } from './components/LocationDetailScreen';

type AppTab = 'home' | 'indoor' | 'assistant' | 'map' | 'profile' | 'details';

type TabItem = {
  id: AppTab;
  label: string;
  Icon: typeof Home;
};

const tabs: TabItem[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'indoor', label: 'Indoor', Icon: HomeIndoor },
  { id: 'assistant', label: 'Chat', Icon: MessageSquare },
  { id: 'map', label: 'Map', Icon: MapIcon },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const { isOnline } = useOnlineStatus();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <AqiProvider>
          <ToastProvider>
            <div className="h-screen w-full bg-surface text-text-main overflow-hidden flex flex-col font-sans transition-colors duration-300">
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'home' && <HomeScreen onNavigate={setActiveTab} />}
                  {activeTab === 'indoor' && <IndoorScreen onNavigate={setActiveTab} />}
                  {activeTab === 'map' && <MapScreen />}
                  {activeTab === 'assistant' && <AssistantScreen />}
                  {activeTab === 'profile' && <ProfileScreen />}
                  {activeTab === 'details' && <LocationDetailScreen onNavigate={setActiveTab} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Navigation */}
            {activeTab !== 'details' && (
            <div className="relative z-50 bg-surface/90 backdrop-blur-xl border-t border-border-subtle transition-colors duration-300">
              <nav className="flex items-center justify-between px-6 pb-6 pt-3 max-w-md mx-auto">
                {tabs.map(({ id, label, Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className="group flex flex-col items-center gap-1.5 px-3 py-1 transition-all duration-200 active:scale-95"
                      aria-label={label}
                    >
                      <div className="relative flex flex-col items-center">
                        <Icon
                          size={22}
                          className={`transition-colors duration-250 ${
                            isActive
                              ? 'text-accent'
                              : 'text-text-sub group-hover:text-text-main'
                          }`}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        {/* Active dot indicator */}
                        {isActive && (
                          <motion.div
                            className="absolute -bottom-2.5 h-[4px] w-[4px] rounded-full bg-accent"
                            layoutId="navIndicator"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                      </div>
                      <span className={`text-[9px] font-semibold mt-2 transition-colors duration-250 ${
                        isActive
                          ? 'text-accent'
                          : 'text-text-sub group-hover:text-text-main'
                      }`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
            )}
            </div>
          </ToastProvider>
        </AqiProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
