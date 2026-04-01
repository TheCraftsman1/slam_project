import { useState, type ReactNode } from 'react';
import { Bot, ChevronRight, Home, Shield, Wind } from 'lucide-react';
import { motion } from 'motion/react';

type NavigateTarget = 'assistant';

interface IndoorScreenProps {
  onNavigate?: (tab: NavigateTarget) => void;
}

type FocusRoom = 'Bedroom' | 'Living room' | 'Kitchen';

export function IndoorScreen({ onNavigate }: IndoorScreenProps) {
  const [focusRoom, setFocusRoom] = useState<FocusRoom>('Bedroom');
  const [alertsOn, setAlertsOn] = useState(true);

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
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent font-display">Indoor</p>
            <h1 className="mt-1.5 text-[28px] font-bold tracking-tight font-display">No monitor yet</h1>
          </div>
        </motion.header>

        {/* ── Setup Card ── */}
        <motion.section
          className="rounded-[28px] bg-card border border-border-subtle shadow-minimal p-6 shadow-elevated relative overflow-hidden"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
        >
          {/* Ambient glow removed since we use solid cards */}

          <div className="relative flex items-start gap-4">
            <div className="rounded-2xl bg-accent/10 p-3 border border-border-subtle">
              <Home size={22} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-text-main font-display">Indoor view unlocks after sensor setup</p>
              <p className="mt-2 text-[13px] leading-relaxed text-text-sub/80">
                Until then, choose your first room and ask EcoBot for placement tips.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => onNavigate?.('assistant')}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl border border-border-strong bg-surface hover:bg-border-subtle px-4 py-3.5 text-[13px] font-bold text-text-main active:scale-[0.97] transition-all shadow-sm"
            >
              <Bot size={16} />
              <span>Ask EcoBot</span>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-border-strong shadow-sm hover:bg-border-subtle active:scale-90 transition-all">
              <ChevronRight size={18} className="text-text-sub" />
            </button>
          </div>
        </motion.section>

        {/* ── Room Selector ── */}
        <motion.section
          className="rounded-[22px] bg-card border border-border-subtle shadow-sm p-4"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-sub">First room</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['Bedroom', 'Living room', 'Kitchen'] as FocusRoom[]).map((room) => {
              const isActive = focusRoom === room;
              return (
                <button
                  key={room}
                  onClick={() => setFocusRoom(room)}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'border-accent bg-accent/10 text-text-main shadow-minimal'
                      : 'border-border-subtle bg-surface text-text-sub hover:bg-border-subtle hover:text-text-main'
                  }`}
                >
                  {room}
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
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        >
          <MiniPanel
            title="Alerts"
            value={alertsOn ? 'On' : 'Off'}
            onClick={() => setAlertsOn((v) => !v)}
            icon={<Shield size={14} className="text-accent" />}
            accentColor={alertsOn ? 'accent' : undefined}
          />
          <MiniPanel
            title="Focus"
            value={focusRoom}
            icon={<Wind size={14} className="text-accent" />}
          />
        </motion.section>
      </div>
    </div>
  );
}

function MiniPanel({
  title,
  value,
  icon,
  onClick,
  accentColor,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  onClick?: () => void;
  accentColor?: string;
}) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      {...(onClick ? { onClick } : {})}
      className={`rounded-[20px] bg-card border border-border-subtle shadow-sm hover:bg-border-subtle transition-colors p-4 text-left ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-sub">{title}</p>
      </div>
      <p className={`mt-2.5 text-[15px] font-bold ${
        accentColor === 'accent' ? 'text-accent' : 'text-text-main'
      }`}>{value}</p>
    </Tag>
  );
}
