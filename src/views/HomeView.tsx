'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Wifi, WifiOff, User } from 'lucide-react';
import { Destination } from '../data/mockData';
import { constructDynamicDestination } from '../utils/dynamicDestination';
import { useTranslation, LanguageCode } from '../utils/translations';

interface HomeViewProps {
  setActiveView: (view: string) => void;
  setSelectedDest: (dest: Destination) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  lang: string;
}

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1920&q=80', // Varanasi
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1920&q=80', // Tokyo
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=80', // Bali
  'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1920&q=80'  // Ladakh
];

export default function HomeView({
  setActiveView,
  setSelectedDest,
  isOffline,
  setIsOffline,
  lang
}: HomeViewProps) {
  const [currentBg, setCurrentBg] = useState(0);
  const [searchVal, setSearchVal] = useState('');
  const [showDates, setShowDates] = useState('2026-10-12');
  const [guests, setGuests] = useState(2);

  const { t } = useTranslation(lang as LanguageCode);

  // Rotate Background Images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = () => {
    if (!searchVal.trim()) return;
    const finalDest = constructDynamicDestination(searchVal.trim());
    setSelectedDest(finalDest);
    setActiveView('discover');
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center pb-12 overflow-hidden">
      
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBg}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMAGES[currentBg]})` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-obsidian via-midnight-obsidian/75 to-black/30" />
        <div className="absolute inset-0 bg-glow-radial opacity-70" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-16 text-center flex flex-col items-center justify-center w-full">
        
        {/* Dynamic Offline Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md mb-6 ${
            isOffline 
              ? 'bg-zinc-800/80 border-zinc-700 text-zinc-400' 
              : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="h-4.5 w-4.5 text-zinc-500 animate-pulse" />
              {t('offlineMode')}
            </>
          ) : (
            <>
              <Wifi className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
              {t('onlineSync')}
            </>
          )}
        </motion.div>

        {/* Brand Tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-none max-w-4xl"
        >
          Explore Smarter with <span className="bg-gradient-to-r from-saffron-radiance via-velvet-rose to-saffron-radiance bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-spin">GOBRO AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-sm sm:text-base md:text-lg text-text-body max-w-2xl leading-relaxed"
        >
          {t('brandDescription')}
        </motion.p>

        {/* Dynamic Actions Row: Access profile and offline simulation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-6 flex flex-wrap justify-center gap-3.5"
        >
          <button
            onClick={() => setActiveView('profile')}
            className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <User className="h-4 w-4 text-velvet-rose" />
            {t('myProfile')} &rarr;
          </button>
          
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`px-5 py-2.5 rounded-full border transition-all text-xs font-bold tracking-wider flex items-center gap-2 shadow-lg cursor-pointer ${
              isOffline
                ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/35'
            }`}
          >
            {isOffline ? <WifiOff className="h-4 w-4 text-zinc-500" /> : <Wifi className="h-4 w-4 text-emerald-400" />}
            {isOffline ? t('syncConnect') : t('simOffline')}
          </button>
        </motion.div>

        {/* Search Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-4xl mt-8 rounded-[32px] border border-white/10 bg-midnight-obsidian/60 p-4 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center gap-3.5"
        >
          <div className="flex-1 w-full flex items-center space-x-3 px-3 py-2 border-b md:border-b-0 md:border-r border-white/10">
            <MapPin className="h-5 w-5 text-velvet-rose flex-shrink-0" />
            <div className="flex-1 text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('targetArea')}</label>
              <input
                type="text"
                placeholder={t('findEscapesPlaceholder')}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-text-muted mt-0.5"
              />
            </div>
          </div>

          <div className="w-full md:w-48 flex items-center space-x-3 px-3 py-2 border-b md:border-b-0 md:border-r border-white/10">
            <Calendar className="h-5 w-5 text-velvet-rose flex-shrink-0" />
            <div className="flex-1 text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('travelDate')}</label>
              <input
                type="date"
                value={showDates}
                onChange={(e) => setShowDates(e.target.value)}
                className="w-full bg-transparent text-sm text-white focus:outline-none mt-0.5 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="w-full md:w-36 flex items-center space-x-3 px-3 py-2">
            <Users className="h-5 w-5 text-text-muted flex-shrink-0" />
            <div className="flex-1 text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('travelers')}</label>
              <select
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="w-full bg-transparent text-sm text-white focus:outline-none mt-0.5"
              >
                {[1, 2, 3, 4, 5, 8].map((n) => (
                  <option key={n} value={n} className="bg-midnight-obsidian text-white">{n} {t('guestCount')}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-sm tracking-wide shadow-lg hover:scale-103 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Search className="h-4.5 w-4.5" />
            {t('findEscapes')}
          </button>
        </motion.div>
      </div>

    </div>
  );
}
