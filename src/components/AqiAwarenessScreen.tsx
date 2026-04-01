import React, { useState, useEffect } from 'react';
import { ChevronLeft, Wind, Palette, HeartPulse, ShieldAlert, Activity, Factory, ShieldCheck, Home, Clock, BarChart2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const aqiAwarenessCards = [
  {
    title: 'What Is NAQI?',
    description: 'India\'s National Air Quality Index turns complex pollution data into a single health number.',
    tip: 'One Number, One Colour, One Description.',
    Icon: Wind,
    details: (
      <div className="space-y-4">
        <p>Launched in 2014 under the Swachh Bharat Abhiyan, the <strong>National Air Quality Index (NAQI)</strong> was built on the principle of <em>"One Number, One Colour, One Description."</em></p>
        <p>Instead of confusing citizens with raw data on multiple pollutants, NAQI tracks 8 major pollutants: PM10, PM2.5, NO₂, SO₂, CO, O₃, NH₃, and Pb (Lead).</p>
        <p>The highest sub-index among these pollutants becomes the overall AQI for that location. Extreme PM2.5 levels are usually what drive the NAQI values into the high-risk zones across Indian cities.</p>
      </div>
    )
  },
  {
    title: 'NAQI Classifications',
    description: 'The Central Pollution Control Board (CPCB) categorizes air into 6 color-coded zones.',
    tip: 'Check the exact CPCB category color before stepping out.',
    Icon: Palette,
    details: (
      <div className="space-y-3">
        <p>The Indian NAQI classifies air quality into six distinct categories with associated health impacts:</p>
        <ul className="space-y-2 mt-3">
          <li className="flex items-start gap-2 bg-surface p-2 rounded-lg border border-border-subtle"><span className="text-green-500 font-black text-lg leading-none mt-1">●</span> <div><strong className="block text-sm">Dark Green (0-50): Good.</strong> <span className="text-[13px] opacity-80">Minimal health impact.</span></div></li>
          <li className="flex items-start gap-2 bg-surface p-2 rounded-lg border border-border-subtle"><span className="text-lime-500 font-black text-lg leading-none mt-1">●</span> <div><strong className="block text-sm">Light Green (51-100): Satisfactory.</strong> <span className="text-[13px] opacity-80">Minor breathing discomfort to sensitive people.</span></div></li>
          <li className="flex items-start gap-2 bg-surface p-2 rounded-lg border border-border-subtle"><span className="text-yellow-500 font-black text-lg leading-none mt-1">●</span> <div><strong className="block text-sm">Yellow (101-200): Moderately Polluted.</strong> <span className="text-[13px] opacity-80">Discomfort to people with lung/heart diseases.</span></div></li>
          <li className="flex items-start gap-2 bg-surface p-2 rounded-lg border border-border-subtle"><span className="text-orange-500 font-black text-lg leading-none mt-1">●</span> <div><strong className="block text-sm">Orange (201-300): Poor.</strong> <span className="text-[13px] opacity-80">Breathing discomfort to most people on prolonged exposure.</span></div></li>
          <li className="flex items-start gap-2 bg-surface p-2 rounded-lg border border-border-subtle"><span className="text-red-500 font-black text-lg leading-none mt-1">●</span> <div><strong className="block text-sm">Red (301-400): Very Poor.</strong> <span className="text-[13px] opacity-80">Respiratory illness on prolonged exposure.</span></div></li>
          <li className="flex items-start gap-2 bg-surface p-2 rounded-lg border border-border-subtle"><span className="text-red-900 font-black text-lg leading-none mt-1">●</span> <div><strong className="block text-sm">Maroon (401-500): Severe.</strong> <span className="text-[13px] opacity-80">Affects healthy people & severely impacts existing diseases.</span></div></li>
        </ul>
      </div>
    )
  },
  {
    title: 'Why AQI Matters',
    description: 'Long-term exposure to PM2.5 can enter the bloodstream and cause immense systemic harm.',
    tip: 'Pollution is a silent crisis, not merely winter fog.',
    Icon: HeartPulse,
    details: (
      <div className="space-y-4">
        <p>In India, high AQI isn't just "fog" or "smog" that obscures vision—it is an invisible public health emergency.</p>
        <p>Extremely fine particles (PM2.5) are 30 times smaller than a human hair. They bypass the body's natural defenses, travelling deep into the lungs and crossing straight into the bloodstream.</p>
        <p>Prolonged exposure drastically increases the risk of chronic bronchitis, asthma, severe cardiovascular problems, and fatigue. Even if you "feel fine," continuous high-AQI exposure reduces your long-term lifespan and lung capacity.</p>
      </div>
    )
  },
  {
    title: 'Who Is Most At Risk?',
    description: 'Children, the elderly, and those with pre-existing conditions are uniquely vulnerable.',
    tip: 'Daily street-side exposure increases risk drastically.',
    Icon: ShieldAlert,
    details: (
      <div className="space-y-4">
        <p>While everyone is affected by terrible air, some groups face catastrophic risks on "Very Poor" or "Severe" days.</p>
        <ul className="list-disc pl-5 space-y-2 marker:text-accent">
          <li><strong>Children:</strong> Their lungs are still developing, and they breathe faster than adults, taking in more polluted air relative to their body weight.</li>
          <li><strong>The Elderly & Pregnant Women:</strong> Compromised immune systems and changing bodily demands make them highly susceptible to complications.</li>
          <li><strong>Outdoor Workers:</strong> Traffic police, vendors, and delivery personnel in Indian metros absorb extremely toxic localized tailpipe emissions for hours.</li>
        </ul>
      </div>
    )
  },
  {
    title: 'Can You Go Outside?',
    description: 'Modify your physical activities strictly according to the current NAQI category.',
    tip: 'Cancel heavy exercise on Yellow, Orange, and Red days.',
    Icon: Activity,
    details: (
      <div className="space-y-4">
        <p>Air quality should dictate your physical exertion levels outdoors.</p>
        <p>When you exercise, your respiratory rate spikes, pulling deeply polluted air into the bottom of your lungs.</p>
        <div className="bg-surface/50 p-4 rounded-xl border border-border-subtle mt-4">
          <strong className="block mb-2 text-accent">General Guideline:</strong>
          <p className="text-[13.5px]">On <strong>Yellow (101-200)</strong> days, sensitive groups should reduce heavy exertion. On <strong>Orange (Poor)</strong> days, completely shift high-intensity workouts like jogging indoors. When levels hit <strong>Red or Maroon (Very Poor/Severe)</strong>, no one should perform outdoor cardio, and brief necessary outdoor visits must require N95 masking.</p>
        </div>
      </div>
    )
  },
  {
    title: 'What Causes Indian Pollution?',
    description: 'A mix of geographic weather patterns, biomass burning, and industrial emissions.',
    tip: 'Temperature inversions trap the pollution in winter.',
    Icon: Factory,
    details: (
      <div className="space-y-4">
        <p>India experiences unique spikes in pollution, particularly from October to January, due to several combined factors:</p>
        <ul className="list-disc pl-5 space-y-2 marker:text-accent">
          <li><strong>Stubble Burning (Parali):</strong> Seasonal agricultural clearing in Northern states creates massive smoke clouds.</li>
          <li><strong>Vehicular Emissions:</strong> High density of older diesel vehicles and traffic gridlocks compounding exhaust output.</li>
          <li><strong>Construction & Dust:</strong> Rampant unpaved roads and construction sites kicking up large PM10 particulates.</li>
          <li><strong>Winter Inversion:</strong> Cold, dense air sweeping across the Indo-Gangetic plain acts like a tight "lid," trapping emissions near the ground rather than letting them disperse cleanly.</li>
        </ul>
      </div>
    )
  },
  {
    title: 'How To Protect Yourself',
    description: 'Masking, indoor air purifiers, and closing windows during peak inversion hours.',
    tip: 'Cloth masks do not stop PM2.5. Always use N95.',
    Icon: ShieldCheck,
    details: (
      <div className="space-y-4">
        <p>Protective measures must be active and informed:</p>
        <ul className="list-disc pl-5 space-y-2 marker:text-accent">
          <li><strong>Mask Wisely:</strong> Normal surgical or cloth face coverings do absolutely nothing against PM2.5. You must use well-fitting <strong>N95 or P100</strong> respirators to filter out the deadly particles.</li>
          <li><strong>Seal Windows:</strong> Do not rely on "fresh morning air" during Indian winters. Morning air is usually the most toxic. Keep windows shut during the early morning and late night.</li>
          <li><strong>Purifiers & Plants:</strong> Use HEPA-certified indoor air purifiers if possible. While indoor plants help slightly, they cannot compete with extreme smog independently.</li>
        </ul>
      </div>
    )
  },
  {
    title: 'Indoor vs Outdoor Air',
    description: 'Indian homes can trap fumes from agarbatti, mosquito coils, and cooking tadka.',
    tip: 'Indoor air is frequently worse without proper kitchen exhaust.',
    Icon: Home,
    details: (
      <div className="space-y-4">
        <p>A common misconception is that simply being indoors saves you. Indian homes are often highly polluted due to domestic sources and poor door/window sealing.</p>
        <strong className="block text-[15px] mt-4 mb-2">Major Sources of Indoor PM2.5:</strong>
        <ul className="list-disc pl-5 space-y-2 marker:text-accent">
          <li>Deep frying and the quintessential Indian <em>tadka</em> (tempering) release massive oil and spice particulates into the air.</li>
          <li>Burning <em>agarbatti</em> (incense), dhoop, or camphor.</li>
          <li>Mosquito repellent coils release particulate matter equivalent to several cigarettes in an enclosed room.</li>
        </ul>
        <p className="mt-4 pt-4 border-t border-border-subtle text-[13.5px]">Use kitchen chimneys, avoid coils, and only ventilate rooms in the afternoon when outdoor AQI gets better.</p>
      </div>
    )
  },
  {
    title: 'Best Time To Go Outside',
    description: 'Post-midday sun breaks the inversion layer, offering a temporary window of cleaner air.',
    tip: 'Never go for a morning run during winter smog.',
    Icon: Clock,
    details: (
      <div className="space-y-4">
        <p>Air quality heavily fluctuates throughout a 24-hour cycle.</p>
        <p>During winter, the <strong>early mornings (5 AM - 9 AM)</strong> and late evenings are the absolute most dangerous times to go out. The cold ground cools the air above it, preventing pollution from rising up and away.</p>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mt-4">
          <p className="text-[13.5px] font-medium text-emerald-700 dark:text-emerald-400">As the strong afternoon sun warms the ground (typically <strong>1 PM - 4 PM</strong>), this inversion layer breaks, allowing the polluted air to rise and disperse. This midday window is your safest time to ventilate the house or walk outside.</p>
        </div>
      </div>
    )
  },
  {
    title: 'Track Your Exposure',
    description: 'Different city zones have micro-environments. Traffic junctions are AQI hotspots.',
    tip: 'Avoid walking alongside extremely congested roads.',
    Icon: BarChart2,
    details: (
      <div className="space-y-4">
        <p>Your actual exposure varies wildly depending on your immediate surroundings, known as <strong>micro-environments</strong>.</p>
        <p>A general city-level AQI might read 150 (Yellow), but walking closely along a gridlocked traffic signal can expose you to an AQI of 400+ purely from localized tailpipe emissions and kicking dust.</p>
        <p>To reduce risk, avoid idling near heavy traffic, choose backstreets and parks over main arterial roads when commuting by foot, and continuously check verified sources like the SAFAR-India app or CPCB national portals before planning your route.</p>
      </div>
    )
  }
];

export function AqiAwarenessScreen({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCard(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Prevent background scroll when modal open
  useEffect(() => {
    if (selectedCard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedCard]);

  return (
    <div className="min-h-full flex flex-col bg-surface pb-10 relative">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-xl border-b border-border-subtle pt-12 pb-4 px-4 flex items-center">
        <button
          onClick={() => onNavigate('home')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border-subtle hover:bg-border-subtle active:scale-95 transition-all text-text-main shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="ml-4 flex-1">
          <h2 className="text-xl font-display font-bold text-text-main tracking-tight">Air Quality & Health</h2>
        </div>
      </header>

      {/* Content Grid */}
      <main className="flex-1 px-4 pt-6 max-w-5xl mx-auto w-full">
        <div className="w-full mb-8">
          <span className="text-[11px] font-black uppercase tracking-widest text-accent block mb-1">NAQI Guide</span>
          <h3 className="text-2xl font-display font-bold tracking-tight text-text-main">Environmental Awareness</h3>
          <p className="text-[14px] text-text-sub mt-2 leading-relaxed max-w-3xl">
            Tap on any topic below to reveal detailed Information based on India's National Air Quality Index (CPCB standards) to make smarter, safer lifestyle decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {aqiAwarenessCards.map((card, index) => {
            const Icon = card.Icon;
            return (
              <motion.article
                onClick={() => setSelectedCard(card)}
                key={card.title}
                className="bg-card border border-border-subtle rounded-3xl p-5 min-h-[220px] flex flex-col shadow-sm hover:shadow-md hover:border-accent/40 active:scale-[0.98] transition-all duration-200 group cursor-pointer relative overflow-hidden"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 * index }}
              >
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-surface border border-border-strong flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
                    <Icon size={20} strokeWidth={2.5} />
                  </div>
                  <h4 className="text-[15px] font-bold text-text-main leading-tight tracking-tight">{card.title}</h4>
                </div>
                
                <p className="text-[13.5px] text-text-sub leading-relaxed flex-1 mt-1 relative z-10">{card.description}</p>
                
                <div className="mt-5 bg-surface/50 rounded-2xl p-3.5 border border-border-subtle flex items-center justify-between group-hover:bg-surface group-hover:border-accent/30 transition-colors duration-300 relative z-10">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-accent drop-shadow-sm">Read Details</span>
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                     <span className="text-[16px] font-light leading-none mb-0.5">+</span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </main>

      {/* Floating Detailed Modal */}
      <AnimatePresence>
        {selectedCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedCard(null)}
            />
            
            <motion.div
              className="relative w-full max-w-xl bg-card rounded-3xl shadow-2xl overflow-hidden border border-border-subtle flex flex-col max-h-[85vh] sm:max-h-[90vh] z-10"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              {/* Modal Header */}
              <div className="flex flex-shrink-0 items-center justify-between p-5 sm:p-6 border-b border-border-subtle bg-surface">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-card border border-border-strong flex items-center justify-center text-accent shadow-sm">
                    <selectedCard.Icon size={24} strokeWidth={2} />
                  </div>
                  <h3 className="font-display font-bold text-xl text-text-main pr-2 leading-tight">{selectedCard.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="w-10 h-10 flex shrink-0 items-center justify-center rounded-full bg-card border border-border-strong text-text-sub hover:text-text-main hover:bg-border-subtle active:scale-90 transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 overflow-y-auto font-sans text-[15px] leading-relaxed text-text-main/90 custom-scrollbar">
                {selectedCard.details}
              </div>

              {/* Modal Footer/Tip */}
              <div className="flex-shrink-0 p-5 sm:p-6 bg-surface border-t border-border-subtle">
                <div className="flex items-start gap-3 bg-accent/10 rounded-2xl p-4 sm:p-5 border border-accent/20">
                  <Info size={20} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[12px] font-black uppercase text-accent tracking-widest mb-1.5">Actionable Tip</h4>
                    <p className="font-semibold text-[14px] text-text-main/85 leading-snug">{selectedCard.tip}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
