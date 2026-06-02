'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, UtensilsCrossed, AlertTriangle, Compass, ChevronDown, ChevronUp, Map, DollarSign, Plus, Check, Database, MapPin } from 'lucide-react';
import { Destination } from '../data/mockData';
import { constructDynamicDestination } from '../utils/dynamicDestination';
import { localDB } from '../utils/offlineCache';
import GlassCard from '../components/GlassCard';
import { useTranslation, LanguageCode } from '../utils/translations';

interface PlannerViewProps {
  setActiveView: (view: string) => void;
  selectedDest: Destination | null;
  setSelectedDest: (dest: Destination) => void;
  addToCart: (item: { id: string; type: string; title: string; price: number; provider: string; details: string }) => void;
  isOffline: boolean;
  lang: string;
  cartItems: any[];
  removeFromCart: (index: number) => void;
}

export default function PlannerView({
  setActiveView,
  selectedDest,
  setSelectedDest,
  addToCart,
  isOffline,
  lang,
  cartItems,
  removeFromCart
}: PlannerViewProps) {
  const [typedDestination, setTypedDestination] = useState(selectedDest ? selectedDest.name : '');
  const [days, setDays] = useState(3);
  const [diet, setDiet] = useState<'any' | 'veg'>('any');
  const [pace, setPace] = useState<'relax' | 'moderate' | 'packed'>('moderate');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilingStep, setCompilingStep] = useState(0);
  const [showItinerary, setShowItinerary] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  const { t } = useTranslation(lang as LanguageCode);

  const isHotelInCart = (hotelId: string) => {
    return cartItems && cartItems.some((item) => item.id === hotelId);
  };

  useEffect(() => {
    if (selectedDest) {
      setTypedDestination(selectedDest.name);
      if (selectedDest.vegFriendly) {
        setDiet('veg');
      }
    }
  }, [selectedDest]);

  const compileLogs = [
    'Connecting to GOBRO AI Co-Pilot client matrix...',
    'Locating PWA database entries...',
    'Querying local client weights tensor parameters...',
    'Compiling dynamic itinerary routes from browser-cache logs...',
    'Injecting local culinary thali recommendations...',
    'Itinerary compiled locally on device!'
  ];

  const handleGenerate = () => {
    if (!typedDestination.trim()) return;
    
    const finalDest = constructDynamicDestination(typedDestination.trim());
    
    setSelectedDest(finalDest);
    setIsCompiling(true);
    setCompilingStep(0);
    setShowItinerary(false);

    const interval = setInterval(() => {
      setCompilingStep((prev) => {
        if (prev < compileLogs.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setIsCompiling(false);
            setShowItinerary(true);

            // SAVE TO OFFLINE INDEXEDDB CACHE
            const estimatedCost = finalDest.hotels[0].price * (days - 1) + finalDest.activities.reduce((acc, act) => acc + act.price, 0) + 3500;
            localDB.saveItinerary({
              id: Math.random().toString(),
              destination: finalDest.name,
              days,
              diet,
              pace,
              compiledAt: new Date().toLocaleDateString(),
              cost: estimatedCost
            }).catch(console.error);

          }, 800);
          return prev;
        }
      });
    }, 900);
  };

  const handleAddHotelToCart = (hotel: any) => {
    addToCart({
      id: hotel.id,
      type: 'Hotel stay',
      title: hotel.name,
      price: hotel.price,
      provider: hotel.provider,
      details: `Rating: ${hotel.rating}⭐`
    });
  };

  const getDaySchedule = (dayIndex: number) => {
    if (!selectedDest) return [];
    
    const schedules: Record<string, Array<Array<{ time: string; activity: string; desc: string; icon: string }>>> = {
      varanasi: [
        [
          { time: '05:30 AM', activity: 'Dawn Boat Ride at Assi Ghat', desc: 'Observe spiritual bathing rituals and early mantras.', icon: 'Compass' },
          { time: '11:00 AM', activity: 'Sarnath Buddhist Stupa Site', desc: 'Ancient pillars and relics where Buddha gave first sermon.', icon: 'MapPin' },
          { time: '06:00 PM', activity: 'Dashashwamedh Ganga Aarti seating', desc: 'Witness choreographic fire lamps rituals on river steps.', icon: 'Sparkles' }
        ],
        [
          { time: '09:00 AM', activity: 'Heritage Handloom Weaving Tour', desc: 'Watch craftsmen weave real Banarasi silk in traditional houses.', icon: 'MapPin' },
          { time: '01:00 PM', activity: 'Sattvik Temple Thali Lunch', desc: 'Pure veg local recipes with mild spices.', icon: 'UtensilsCrossed' },
          { time: '05:00 PM', activity: 'Ghat-to-Ghat Heritage Alley Walk', desc: 'Deep dive into spiritual history and ancient shrines.', icon: 'Compass' }
        ],
        [
          { time: '08:00 AM', activity: 'Kashi Vishwanath Corridor Walk', desc: 'Newly designed sacred walkway leading directly to holy sanctum.', icon: 'Sparkles' },
          { time: '02:00 PM', activity: 'Clay Pottery workshop at Ramnagar', desc: 'Hands-on training with village local craftsmen.', icon: 'Compass' },
          { time: '07:00 PM', activity: 'Classical Sitar session on a Ghat rooftop', desc: 'Listen to classical ragas overlooking the night Ganga.', icon: 'Sparkles' }
        ]
      ],
      default: [
        [
          { time: '09:00 AM', activity: 'Local Sightseeing & Heritage trails', desc: `Explore primary landmarks and parks around ${selectedDest.name}.`, icon: 'Compass' },
          { time: '02:00 PM', activity: 'Regional Culinary Lunch slot', desc: 'Sample authentic cuisine at local cooperatives.', icon: 'UtensilsCrossed' },
          { time: '06:30 PM', activity: 'Sunset point panoramic hike', desc: 'Trek to popular viewpoint overlooking local landscapes.', icon: 'Sparkles' }
        ],
        [
          { time: '08:30 AM', activity: 'Active Eco Tour or Trekking slot', desc: 'Experience local flora and fauna accompanied by expert guides.', icon: 'Leaf' },
          { time: '03:00 PM', activity: 'Local Handicrafts and markets', desc: 'Interact with community vendors and buy souvenirs.', icon: 'MapPin' },
          { time: '07:30 PM', activity: 'Cultural folk performance', desc: 'Relax and witness traditional dances and music.', icon: 'Sparkles' }
        ],
        [
          { time: '09:30 AM', activity: 'Museum or Palace tour', desc: 'Understand historical context and design heritage.', icon: 'Compass' },
          { time: '01:30 PM', activity: 'Leisurely cafe hopping', desc: 'Relax at top-rated local rooftops.', icon: 'Coffee' },
          { time: '05:00 PM', activity: 'Interactive workshop', desc: 'Bespoke pottery or cooking lessons.', icon: 'Sparkles' }
        ]
      ]
    };

    const targetList = schedules[selectedDest.id] || schedules.default;
    return targetList[dayIndex % targetList.length];
  };

  return (
    <div className={`w-full max-w-6xl mx-auto px-6 py-8 flex flex-col space-y-8 min-h-[calc(100vh-140px)] transition-all duration-300 ${
      isOffline ? 'filter saturate-75 opacity-90' : ''
    }`}>
      
      {/* Title */}
      <div>
        <span className="text-xs text-saffron-radiance font-semibold uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" /> 
          {isOffline ? 'PWA Offline compiler active' : 'Dynamic timeline compiler active'}
        </span>
        <h1 className="text-3xl font-bold font-display text-white mt-1">{t('planner')}</h1>
      </div>

      {/* Input configuration panel */}
      {!isCompiling && !showItinerary && (
        <GlassCard glowColor="rose" className="max-w-3xl mx-auto p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6 font-display flex items-center gap-2">
            {t('configureParameters')}
          </h2>

          <div className="space-y-6">
            {/* Dynamic Text Input Box (Supports Any Destination!) */}
            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">{t('targetArea')}</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-velvet-rose" />
                <input
                  type="text"
                  placeholder={t('findEscapesPlaceholder')}
                  value={typedDestination}
                  onChange={(e) => setTypedDestination(e.target.value)}
                  className="w-full bg-black/40 text-sm text-white border border-white/10 rounded-xl p-3 pl-11 focus:outline-none focus:border-velvet-rose/50"
                />
              </div>
            </div>

            {/* Grid with Separate Distinct Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">{t('duration')}</label>
                <div className="flex gap-2">
                  {[2, 3, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setDays(n)}
                      className={`flex-1 py-2 text-xs rounded-xl border transition-all font-semibold ${
                        days === n 
                          ? 'bg-velvet-rose text-white border-velvet-rose shadow-md' 
                          : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {n} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">{t('dietConstraints')}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDiet('any')}
                    className={`flex-1 py-2 text-xs rounded-xl border transition-all font-semibold ${
                      diet === 'any' 
                        ? 'bg-white text-black border-white shadow-md' 
                        : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {t('standardDiet')}
                  </button>
                  <button
                    onClick={() => setDiet('veg')}
                    className={`flex-1 py-2 text-xs rounded-xl border transition-all font-semibold flex items-center justify-center gap-1 ${
                      diet === 'veg' 
                        ? 'bg-green-600 text-white border-green-600 shadow-md' 
                        : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
                    }`}
                  >
                    🥦 {t('pureVeg')}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">{t('paceLevel')}</label>
                <div className="flex gap-2 text-xs">
                  {['relax', 'moderate', 'packed'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPace(p as any)}
                      className={`flex-1 py-2 rounded-xl border capitalize transition-all font-semibold ${
                        pace === p 
                          ? 'bg-saffron-radiance text-black border-saffron-radiance shadow-md' 
                          : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Warning alerts */}
            {selectedDest?.id === 'leh' && (
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="text-left text-xs">
                  <span className="font-bold text-white">{t('acclimatizationWarning')}:</span>
                  <p className="text-text-muted mt-1 leading-relaxed">
                    Leh is located at high altitudes. GOBRO automatically plans rest blocks on Day 1 to ensure safe adaptation.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleGenerate}
              disabled={!typedDestination.trim()}
              className="w-full mt-4 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-sm tracking-wider py-4 rounded-2xl shadow-lg hover:scale-102 disabled:opacity-40 disabled:hover:scale-100 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              {t('compileRoute')}
            </button>
          </div>
        </GlassCard>
      )}

      {/* Terminal Compilation Logs */}
      <AnimatePresence>
        {isCompiling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto w-full glassmorphism rounded-3xl p-6 font-mono text-xs text-left"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
              </div>
              <span className="text-[10px] text-text-muted">gobro_dynamic_compiler.sh</span>
            </div>

            <div className="space-y-2 min-h-[140px]">
              {compilingStep >= 0 && <p className="text-text-muted">&gt; Constructing feature maps for {typedDestination}...</p>}
              {compileLogs.slice(0, compilingStep + 1).map((log, idx) => {
                const isLast = idx === compilingStep;
                return (
                  <p 
                    key={idx} 
                    className={`${isLast && compilingStep < compileLogs.length - 1 ? 'text-saffron-radiance' : 'text-white'}`}
                  >
                    &gt; {log}
                    {isLast && compilingStep < compileLogs.length - 1 && <span className="animate-pulse">_</span>}
                  </p>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Itinerary Output View */}
      {showItinerary && selectedDest && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left: Itinerary Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display text-white">{selectedDest.name} Route Schedule ({days} Days)</h2>
              <button
                onClick={() => setShowItinerary(false)}
                className="text-xs text-text-muted hover:text-white"
              >
                Change Parameters
              </button>
            </div>

            {[...Array(days)].map((_, dayIdx) => {
              const isOpen = expandedDay === dayIdx;
              const schedule = getDaySchedule(dayIdx);

              return (
                <GlassCard
                  key={dayIdx}
                  hoverEffect={false}
                  className="p-0 overflow-hidden border border-white/5 bg-white/2"
                >
                  <div
                    onClick={() => setExpandedDay(isOpen ? null : dayIdx)}
                    className="p-5 flex items-center justify-between cursor-pointer border-b border-white/5 bg-white/1 select-none"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-velvet-rose/10 border border-velvet-rose/20 flex items-center justify-center text-velvet-rose font-black text-sm">
                        D{dayIdx + 1}
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-bold text-white">Day {dayIdx + 1}</h3>
                        <span className="text-[10px] text-text-muted">
                          {dayIdx === 0 ? 'Arrival, orientation, and twilight sights' : dayIdx === days - 1 ? 'Bespoke souvenirs and checkout' : 'Deep dive local exploration'}
                        </span>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-text-muted" /> : <ChevronDown className="h-5 w-5 text-text-muted" />}
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 relative pl-10 md:pl-12 border-t border-white/5">
                          <div className="absolute left-6.5 top-8 bottom-8 w-0.5 bg-white/10" />

                          <div className="space-y-6">
                            {schedule.map((item, idx) => (
                              <div key={idx} className="relative flex items-start gap-4">
                                <div className="absolute -left-[30px] md:-left-[34px] h-7 w-7 rounded-full bg-midnight-obsidian border border-white/20 flex items-center justify-center text-saffron-radiance">
                                  <Clock className="h-3.5 w-3.5" />
                                </div>

                                <div className="text-left flex-1 pl-4">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-radiance font-mono">{item.time}</span>
                                    <h4 className="text-sm font-semibold text-white">{item.activity}</h4>
                                  </div>
                                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              );
            })}
          </div>

          {/* Right: Live Google Map Embed & Bookings */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Live Interactive Google Maps Embed */}
            <GlassCard glowColor="white" className="p-0 overflow-hidden h-[280px] flex flex-col justify-end bg-black relative border border-white/10">
              <div className="absolute inset-0 z-0">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(120%)' }} // Premium Dark Theme filter overlay!
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedDest.name)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                />
              </div>

              <div className="relative z-10 p-3 bg-midnight-obsidian/90 border-t border-white/10 text-left text-white flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                    Google Map: {selectedDest.name}
                  </h4>
                  <p className="text-[9px] text-text-muted">Live zoomable GPS coordinates active</p>
                </div>
              </div>
            </GlassCard>

            {/* Cost Breakdown */}
            <GlassCard hoverEffect={false} className="p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                <DollarSign className="h-4 w-4 text-green-400" />
                Est. Cost Summary (per person)
              </h3>
              
              <div className="space-y-2.5 text-xs text-text-muted border-b border-white/5 pb-3">
                <div className="flex justify-between">
                  <span>Hotel Stay ({days - 1} nights)</span>
                  <span className="text-white font-semibold">₹ {selectedDest.hotels[0].price * (days - 1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Local Tours & Activities</span>
                  <span className="text-white font-semibold">₹ {selectedDest.activities.reduce((acc, act) => acc + act.price, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Simulated Travel Buffer</span>
                  <span className="text-white font-semibold">₹ 3,500</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 text-sm font-bold text-white mb-4">
                <span>Total Budget</span>
                <span className="text-saffron-radiance">
                  ₹ {selectedDest.hotels[0].price * (days - 1) + selectedDest.activities.reduce((acc, act) => acc + act.price, 0) + 3500}
                </span>
              </div>

              {/* Direct Quick Book Items */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider block text-left">Integrated Hotels</span>
                {selectedDest.hotels.map((hotel) => (
                  <div key={hotel.id} className="flex items-center justify-between bg-white/3 border border-white/5 rounded-xl p-2.5">
                    <div className="text-left">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">{hotel.provider}</span>
                      <span className="text-xs font-semibold text-white block truncate max-w-[150px]">{hotel.name}</span>
                      <span className="text-[10px] text-green-400 font-mono">₹{hotel.price}/night</span>
                    </div>
                    {isHotelInCart(hotel.id) ? (
                      <button
                        onClick={() => {
                          const idx = cartItems.findIndex(item => item.id === hotel.id);
                          if (idx > -1) removeFromCart(idx);
                        }}
                        className="p-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-0.5 text-[10px] font-bold transition-transform active:scale-95 shadow-md"
                      >
                        <Check className="h-3.5 w-3.5 animate-pulse" /> Booked
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddHotelToCart(hotel)}
                        className="p-1.5 rounded-lg bg-velvet-rose hover:bg-red-700 text-white flex items-center gap-0.5 text-[10px] font-bold transition-transform active:scale-95 shadow-md"
                      >
                        <Plus className="h-3.5 w-3.5" /> Book
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>

            <button
              onClick={() => setActiveView('booking')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider shadow-lg hover:scale-102 transition-transform flex items-center justify-center gap-1.5"
            >
              Configure simulated tickets &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
