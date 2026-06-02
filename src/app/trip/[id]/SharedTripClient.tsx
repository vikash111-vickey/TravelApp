'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, UtensilsCrossed, ArrowLeft, Compass, DollarSign, MapPin, Calendar, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { initFirebaseClient, mockDb } from '../../../utils/firebase';
import LiveNatureBackground from '../../../components/LiveNatureBackground';
import GlassCard from '../../../components/GlassCard';

export default function SharedTripClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  useEffect(() => {
    if (!id) return;

    const fetchSharedItinerary = async () => {
      setLoading(true);
      setError(null);
      
      let activeDb = mockDb;
      try {
        const { db } = await initFirebaseClient();
        activeDb = db;
      } catch (err) {
        console.warn("Using local database fallback to fetch shared itinerary.");
      }

      try {
        const snap = await activeDb.collection('shared_itineraries').doc(id).get();
        if (snap.exists) {
          setItinerary(snap.data());
        } else {
          setError("Itinerary not found. It may have been removed or the link is incorrect.");
        }
      } catch (err) {
        console.error("Failed to load shared itinerary:", err);
        setError("Unable to connect to the database. Please check your internet connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedItinerary();
  }, [id]);

  const getDaySchedule = (dayIndex: number) => {
    if (!itinerary?.selectedDest) return [];
    
    const destId = itinerary.selectedDest.id;
    const name = itinerary.selectedDest.name;

    const schedules: Record<string, Array<Array<{ time: string; activity: string; desc: string }>>> = {
      varanasi: [
        [
          { time: '05:30 AM', activity: 'Dawn Boat Ride at Assi Ghat', desc: 'Observe spiritual bathing rituals and early mantras.' },
          { time: '11:00 AM', activity: 'Sarnath Buddhist Stupa Site', desc: 'Ancient pillars and relics where Buddha gave first sermon.' },
          { time: '06:00 PM', activity: 'Dashashwamedh Ganga Aarti seating', desc: 'Witness choreographic fire lamps rituals on river steps.' }
        ],
        [
          { time: '09:00 AM', activity: 'Heritage Handloom Weaving Tour', desc: 'Watch craftsmen weave real Banarasi silk in traditional houses.' },
          { time: '01:00 PM', activity: 'Sattvik Temple Thali Lunch', desc: 'Pure veg local recipes with mild spices.' },
          { time: '05:00 PM', activity: 'Ghat-to-Ghat Heritage Alley Walk', desc: 'Deep dive into spiritual history and ancient shrines.' }
        ],
        [
          { time: '08:00 AM', activity: 'Kashi Vishwanath Corridor Walk', desc: 'Newly designed sacred walkway leading directly to holy sanctum.' },
          { time: '02:00 PM', activity: 'Clay Pottery workshop at Ramnagar', desc: 'Hands-on training with village local craftsmen.' },
          { time: '07:00 PM', activity: 'Classical Sitar session on a Ghat rooftop', desc: 'Listen to classical ragas overlooking the night Ganga.' }
        ]
      ],
      default: [
        [
          { time: '09:00 AM', activity: 'Local Sightseeing & Heritage trails', desc: `Explore primary landmarks and parks around ${name}.` },
          { time: '02:00 PM', activity: 'Regional Culinary Lunch slot', desc: 'Sample authentic cuisine at local cooperatives.' },
          { time: '06:30 PM', activity: 'Sunset point panoramic hike', desc: 'Trek to popular viewpoint overlooking local landscapes.' }
        ],
        [
          { time: '08:30 AM', activity: 'Active Eco Tour or Trekking slot', desc: 'Experience local flora and fauna accompanied by expert guides.' },
          { time: '03:00 PM', activity: 'Local Handicrafts and markets', desc: 'Interact with community vendors and buy souvenirs.' },
          { time: '07:30 PM', activity: 'Cultural folk performance', desc: 'Relax and witness traditional dances and music.' }
        ],
        [
          { time: '09:30 AM', activity: 'Museum or Palace tour', desc: 'Understand historical context and design heritage.' },
          { time: '01:30 PM', activity: 'Leisurely cafe hopping', desc: 'Relax at top-rated local rooftops.' },
          { time: '05:00 PM', activity: 'Interactive workshop', desc: 'Bespoke pottery or cooking lessons.' }
        ]
      ]
    };

    const targetList = schedules[destId] || schedules.default;
    return targetList[dayIndex % targetList.length];
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-midnight-obsidian text-text-body overflow-x-hidden bg-accent-glow select-none">
      
      {/* Live Nature Backdrop */}
      <LiveNatureBackground />

      {/* Global Header Banner */}
      <header className="sticky top-0 z-50 w-full px-4 py-3 md:px-8 bg-midnight-obsidian/40 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div 
            onClick={() => router.push('/')}
            className="flex cursor-pointer items-center space-x-2 font-display text-xl font-bold tracking-tight text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-velvet-rose to-saffron-radiance text-white shadow-sm">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <span>Wander<span className="bg-gradient-to-r from-saffron-radiance to-velvet-rose bg-clip-text text-transparent">Lens</span></span>
          </div>

          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Go to WanderLens Home
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col items-center justify-center relative z-10">
        
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 text-velvet-rose animate-spin" />
            <p className="text-xs text-text-muted font-mono tracking-widest uppercase animate-pulse">
              Retrieving Shared Experience Payload...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center max-w-md text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-red-950/45 border border-red-500/30 flex items-center justify-center text-red-400 text-xl">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-white font-display">Itinerary Unreachable</h2>
            <p className="text-xs text-text-muted leading-relaxed">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 px-5 py-2.5 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              Go to Planner Home
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-8 text-left"
          >
            
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
              <div>
                <span className="text-[10px] bg-saffron-radiance/20 text-saffron-radiance border border-saffron-radiance/30 px-2.5 py-1 rounded-full font-mono uppercase font-bold tracking-wide">
                  🌏 Public Itinerary Share
                </span>
                <h1 className="text-3xl font-bold font-display text-white mt-3">
                  Trip to {itinerary.destinationName}
                </h1>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Curated by <span className="text-white font-semibold">{itinerary.ownerName}</span> &bull; Compiled on {itinerary.compiledAt}
                </p>
              </div>

              {/* Badges / Meta info grid */}
              <div className="flex gap-2.5 flex-wrap">
                <span className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl text-[10px] text-white font-bold font-mono uppercase tracking-wide">
                  📅 {itinerary.days} Days
                </span>
                <span className={`bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl text-[10px] text-white font-bold font-mono uppercase tracking-wide ${itinerary.diet === 'veg' ? 'text-green-400' : ''}`}>
                  {itinerary.diet === 'veg' ? '🥦 Pure Veg' : '🍲 Standard Diet'}
                </span>
                <span className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl text-[10px] text-white font-bold font-mono uppercase tracking-wide capitalize">
                  ⚡ {itinerary.pace} Pace
                </span>
              </div>
            </div>

            {/* Content Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column: Timeline details */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-lg font-bold font-display text-white mb-2">Schedule Itinerary</h2>
                
                {[...Array(itinerary.days)].map((_, dayIdx) => {
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
                          <div>
                            <h3 className="text-sm font-bold text-white">Day {dayIdx + 1}</h3>
                            <span className="text-[10px] text-text-muted">
                              {dayIdx === 0 ? 'Arrival, orientation, and twilight sights' : dayIdx === itinerary.days - 1 ? 'Bespoke souvenirs and checkout' : 'Deep dive local exploration'}
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

              {/* Right Column: Cost summary & Map preview */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Map preview */}
                <GlassCard glowColor="white" className="p-0 overflow-hidden h-[250px] flex flex-col justify-end bg-black relative border border-white/10">
                  <div className="absolute inset-0 z-0">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(120%)' }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(itinerary.destinationName)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>
                  <div className="relative z-10 p-3 bg-midnight-obsidian/90 border-t border-white/10 text-left text-white">
                    <h4 className="text-xs font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                      Map Index: {itinerary.destinationName}
                    </h4>
                  </div>
                </GlassCard>

                {/* Budget summary */}
                <GlassCard hoverEffect={false} className="p-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    Est. Cost Summary (per person)
                  </h3>
                  
                  <div className="space-y-2.5 text-xs text-text-muted border-b border-white/5 pb-3">
                    <div className="flex justify-between">
                      <span>Hotel Stay ({itinerary.days - 1} nights)</span>
                      <span className="text-white font-semibold">₹ {itinerary.selectedDest.hotels?.[0]?.price * (itinerary.days - 1) || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Local Tours & Activities</span>
                      <span className="text-white font-semibold">₹ {itinerary.selectedDest.activities?.reduce((acc: any, act: any) => acc + act.price, 0) || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Simulated Buffer</span>
                      <span className="text-white font-semibold">₹ 3,500</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 text-sm font-bold text-white">
                    <span>Total Budget</span>
                    <span className="text-saffron-radiance">
                      ₹ {itinerary.cost}
                    </span>
                  </div>
                </GlassCard>

                {/* Call-to-action banner promoting WanderLens */}
                <GlassCard glowColor="rose" className="p-6 text-center space-y-4 bg-gradient-to-br from-velvet-rose/10 to-saffron-radiance/5 border-white/15">
                  <span className="text-[10px] font-mono tracking-widest text-saffron-radiance uppercase font-bold block">Create Your Own Itinerary</span>
                  <h4 className="text-sm font-bold text-white leading-snug">Ditch planning fatigue. Build custom AI routes with WanderLens.</h4>
                  <p className="text-[10px] text-text-muted leading-relaxed">WanderLens generates personalized itineraries based on your budget, food limits, and travel persona.</p>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full py-3 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white text-xs font-bold rounded-xl shadow-lg hover:scale-102 transition-transform cursor-pointer"
                  >
                    Start Curating Free
                  </button>
                </GlassCard>

              </div>
            </div>

          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-black/40 border-t border-white/5 text-center text-xs text-text-muted mt-12 relative z-10">
        <p>&copy; {new Date().getFullYear()} WanderLens AI Travel Platform. Built offline-first using client-side model weights.</p>
      </footer>
    </div>
  );
}
