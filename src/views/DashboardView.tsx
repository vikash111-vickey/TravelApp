'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, Calendar, Camera, ChevronRight, Database, History, RefreshCw } from 'lucide-react';
import { Destination } from '../data/mockData';
import { localDB, OfflineItinerary, OfflinePolaroid } from '../utils/offlineCache';
import GlassCard from '../components/GlassCard';

interface Trip {
  id: string;
  name: string;
  date: string;
  status: string;
  itemsCount: number;
}

interface DashboardViewProps {
  setActiveView: (view: string) => void;
  upcomingTrips: Trip[];
  selectedDest: Destination | null;
  isOffline: boolean;
}

const POLAROID_IMAGES = [
  { id: 'p1', title: 'Ganga Aarti Mystique', url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&w=600&q=80' },
  { id: 'p2', title: 'Himalayan Pass Roads', url: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=600&q=80' },
  { id: 'p3', title: 'Palolem Beach Sunsets', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { id: 'p4', title: 'Misty Cardamom Estates', url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80' }
];

export default function DashboardView({
  setActiveView,
  upcomingTrips,
  selectedDest,
  isOffline
}: DashboardViewProps) {
  const [diaryNote, setDiaryNote] = useState('Watching the dawn boat rowers glide across Assi Ghat...');
  const [polaroidImage, setPolaroidImage] = useState(POLAROID_IMAGES[0].url);
  const [isMemoryGenerated, setIsMemoryGenerated] = useState(false);
  
  // Offline database records
  const [offlineItineraries, setOfflineItineraries] = useState<OfflineItinerary[]>([]);
  const [offlinePolaroids, setOfflinePolaroids] = useState<OfflinePolaroid[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Load records from IndexedDB
  const refreshLocalRecords = async () => {
    try {
      setIsDbLoading(true);
      const itineraries = await localDB.getItineraries();
      const polaroids = await localDB.getPolaroids();
      setOfflineItineraries(itineraries);
      setOfflinePolaroids(polaroids);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    refreshLocalRecords();
  }, []);

  const handleGenerateMemory = async () => {
    const newPolaroid: OfflinePolaroid = {
      id: Math.random().toString(),
      note: diaryNote,
      imageUrl: polaroidImage,
      timestamp: new Date().toLocaleDateString()
    };

    // Save to IndexedDB
    try {
      await localDB.savePolaroid(newPolaroid);
      await refreshLocalRecords();
      setIsMemoryGenerated(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto px-6 py-8 flex flex-col space-y-8 min-h-[calc(100vh-140px)] transition-all duration-300 ${
      isOffline ? 'filter saturate-75 opacity-90' : ''
    }`}>
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-saffron-radiance font-semibold uppercase tracking-wider flex items-center gap-1">
            <Compass className="h-3.5 w-3.5" /> 
            {isOffline ? 'OFFLINE INDEXEDDB DASHBOARD CACHE' : 'Traveler Control Station'}
          </span>
          <h1 className="text-3xl font-bold font-display text-white mt-1">My Trip Dashboard</h1>
        </div>

        <button 
          onClick={refreshLocalRecords} 
          className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-text-muted hover:text-white flex items-center gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reload Local Cache
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Registered Journeys & Local DB Records */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: Live Bookings */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-saffron-radiance" />
              Active Online Expeditions
            </h2>

            {upcomingTrips.map((trip) => (
              <div 
                key={trip.id}
                className="glassmorphism rounded-2xl p-5 border border-white/5 bg-white/2 flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-11 w-11 rounded-xl bg-saffron-radiance/10 border border-saffron-radiance/20 flex items-center justify-center text-saffron-radiance font-bold text-lg">
                    🗺️
                  </div>
                  <div>
                    <span className="text-[10px] text-green-400 font-mono font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      {trip.status}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{trip.name} Trip</h3>
                    <p className="text-[10px] text-text-muted mt-0.5 font-mono">Date: {trip.date} &bull; {trip.itemsCount} vouchers synced</p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveView('itinerary')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors flex items-center gap-1"
                >
                  Itinerary <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Section: Offline Compiled Itineraries (IndexedDB) */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Database className="h-5 w-5 text-velvet-rose" />
              Offline Compiled Itineraries (IndexedDB Caches)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offlineItineraries.map((it) => (
                <div 
                  key={it.id} 
                  className="glassmorphism rounded-2xl p-4 border border-white/5 bg-white/1 text-left flex flex-col justify-between h-[135px]"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-white">{it.destination} Plan</h3>
                      <span className="bg-velvet-rose/20 text-velvet-rose border border-velvet-rose/30 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wide flex items-center gap-0.5">
                        <Database className="h-2 w-2" /> cached
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                      Duration: {it.days} Days &bull; Diet: {it.diet.toUpperCase()} &bull; Pace: {it.pace}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/5 text-[10px] font-bold">
                    <span className="text-text-muted">Compiled: {it.compiledAt}</span>
                    <span className="text-saffron-radiance">Est Cost: ₹{it.cost}</span>
                  </div>
                </div>
              ))}

              {offlineItineraries.length === 0 && (
                <div className="col-span-2 text-center py-6 border border-dashed border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-text-muted">No offline cached itineraries generated.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Polaroid Memory Capsule */}
        <div className="lg:col-span-1 space-y-6">
          
          <GlassCard hoverEffect={false} className="p-5 flex flex-col justify-between space-y-6">
            <div className="text-left">
              <span className="text-[10px] text-saffron-radiance font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Camera className="h-4 w-4" />
                Polaroid Memory Capsule
              </span>
              <h3 className="text-base font-bold text-white mt-1">Visual Log Compiler</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Log a diary note, select a postcard template, and print a custom retro Polaroid frame.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!isMemoryGenerated ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 text-left"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block"> Postcard Visual Template</label>
                    <div className="grid grid-cols-4 gap-2">
                      {POLAROID_IMAGES.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setPolaroidImage(img.url)}
                          className={`h-11 rounded-lg overflow-hidden border transition-all ${
                            polaroidImage === img.url ? 'border-saffron-radiance scale-102 ring-2 ring-saffron-radiance/20' : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img.url} alt={img.title} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Diary Entry</label>
                    <textarea
                      value={diaryNote}
                      onChange={(e) => setDiaryNote(e.target.value)}
                      rows={2}
                      maxLength={100}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-velvet-rose/50"
                      placeholder="Write a custom memory..."
                    />
                  </div>

                  <button
                    onClick={handleGenerateMemory}
                    className="w-full bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-4 w-4" /> Print Custom Polaroid
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="polaroid"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-full max-w-[240px] bg-white border border-black/10 shadow-2xl p-3.5 pb-6 text-black transform rotate-2">
                    <div className="w-full aspect-square overflow-hidden bg-zinc-100 border border-black/5 relative">
                      <img src={polaroidImage} alt="Polaroid Memory" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-yellow-500/5 mix-blend-color-burn" />
                    </div>
                    <div className="mt-4 font-serif text-xs italic tracking-wider text-zinc-800 text-center leading-relaxed font-semibold break-words">
                      "{diaryNote}"
                    </div>
                  </div>

                  <div className="flex gap-2 w-full mt-6">
                    <button
                      onClick={() => setIsMemoryGenerated(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors"
                    >
                      Write Another
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* List of Offline post-cards in DB */}
          {offlinePolaroids.length > 0 && (
            <div className="space-y-3 text-left">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest flex items-center gap-1">
                <History className="h-3.5 w-3.5" /> History Postcards
              </span>
              <div className="grid grid-cols-2 gap-3">
                {offlinePolaroids.map((p) => (
                  <div key={p.id} className="bg-white p-2 border border-black/10 rounded shadow-md text-black rotate-1 hover:rotate-0 transition-transform">
                    <div className="w-full aspect-square overflow-hidden bg-zinc-100 border border-black/5">
                      <img src={p.imageUrl} alt="Polaroid" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[8px] font-serif italic text-center truncate mt-2">"{p.note}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
