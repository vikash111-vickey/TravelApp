'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, MapPin, Calendar, Plus, Check, Compass, Landmark, Hotel, ShieldAlert, ArrowRight, Eye, Shield, Users, CloudSun, Sparkles, Navigation, Loader2 } from 'lucide-react';
import { Destination } from '../data/mockData';
import { searchRealWorldLocation, RealWorldDestination } from '../utils/geosearch';
import GlassCard from '../components/GlassCard';
import ARView from '../components/ARView';

interface DiscoverViewProps {
  setActiveView: (view: string) => void;
  userArchetype: string;
  setSelectedDest: (dest: Destination) => void;
  selectedDest: Destination | null;
  isOffline: boolean;
  cartItems: any[];
  addToCart: (item: any) => void;
  removeFromCart: (index: number) => void;
  onTriggerSOS: () => void;
}

export default function DiscoverView({
  setActiveView,
  userArchetype,
  setSelectedDest,
  selectedDest,
  isOffline,
  cartItems,
  addToCart,
  removeFromCart,
  onTriggerSOS
}: DiscoverViewProps) {
  const [searchVal, setSearchVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAR, setActiveAR] = useState(false);
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');

  // Hook to resolve dynamic parameters if query entered from Homepage
  useEffect(() => {
    const resolveRealWorld = async () => {
      if (selectedDest && !('monuments' in selectedDest && Array.isArray((selectedDest as any).monuments) && (selectedDest as any).monuments[0] && 'distance' in (selectedDest as any).monuments[0])) {
        setIsLoading(true);
        try {
          const dest = await searchRealWorldLocation(selectedDest.name, isOffline);
          setSelectedDest(dest);
        } catch (e) {
          console.error("Failed to load real-world geocoding on mount:", e);
        } finally {
          setIsLoading(false);
        }
      }
    };
    resolveRealWorld();
  }, [selectedDest]);

  // Sync mapEmbedUrl with selectedDest
  useEffect(() => {
    if (selectedDest) {
      setMapEmbedUrl(`https://maps.google.com/maps?q=${encodeURIComponent(selectedDest.name)}&t=&z=12&ie=UTF8&iwloc=&output=embed`);
    } else {
      setMapEmbedUrl('');
    }
  }, [selectedDest]);

  const handleShowRoute = (destLat: number, destLng: number) => {
    const realDest = selectedDest && ('monuments' in selectedDest) ? (selectedDest as unknown as RealWorldDestination) : null;
    if (realDest) {
      const originLat = realDest.coordinates.lat;
      const originLng = realDest.coordinates.lng;
      setMapEmbedUrl(`https://maps.google.com/maps?saddr=${originLat},${originLng}&daddr=${destLat},${destLng}&output=embed`);
    }
  };

  const isHotelInCart = (hotelId: string) => {
    return cartItems && cartItems.some((item) => item.id === hotelId);
  };

  const handleSearchSubmit = async () => {
    if (!searchVal.trim()) return;
    setIsLoading(true);
    try {
      const dest = await searchRealWorldLocation(searchVal.trim(), isOffline);
      setSelectedDest(dest);
    } catch (e) {
      console.error("Geosearch submission error:", e);
    } finally {
      setIsLoading(false);
      setActiveAR(false);
    }
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

  const realDest = selectedDest && ('monuments' in selectedDest) ? (selectedDest as unknown as RealWorldDestination) : null;

  return (
    <div className={`w-full max-w-7xl mx-auto px-6 py-8 flex flex-col space-y-8 min-h-[calc(100vh-140px)] transition-all duration-300 ${
      isOffline ? 'filter saturate-75 opacity-90' : ''
    }`}>
      
      {/* Search Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl border border-white/10 bg-midnight-obsidian/75 backdrop-blur-xl">
        <div className="flex items-center space-x-3 w-full md:max-w-md bg-black/45 px-3 py-2.5 rounded-2xl border border-white/10">
          <MapPin className="h-5 w-5 text-velvet-rose flex-shrink-0" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            placeholder="Search any real-world location (e.g. Paris, Delhi, New York)..."
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-text-muted"
          />
        </div>
        <button
          onClick={handleSearchSubmit}
          className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98 transition-transform cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Resolving...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Scan Coordinates
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 space-y-6 text-center"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute h-20 w-20 rounded-full border border-rose-500/20 border-t-rose-500 animate-spin" />
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-rose-500 text-lg">
                📡
              </div>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white font-display">Acquiring Satellite Lock</h3>
              <p className="text-xs text-text-muted max-w-xs leading-relaxed font-mono">
                &gt;&gt; Querying real-world OpenStreetMap nodes...<br />
                &gt;&gt; Resolving places, monuments, and hotels...
              </p>
            </div>
          </motion.div>
        ) : realDest ? (
          <motion.div
            key={realDest.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 text-left"
          >
            {/* Location banner */}
            <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden border border-white/10">
              <img
                src={realDest.imageUrl}
                alt={realDest.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              
              <div className="absolute top-4 left-4 bg-midnight-obsidian/90 border border-white/15 px-3.5 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1">
                📍 {realDest.state}
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
                <div>
                  <h1 className="font-display font-extrabold text-3xl md:text-5xl">{realDest.name}</h1>
                  <p className="text-xs text-text-muted mt-2 max-w-xl leading-relaxed">{realDest.description}</p>
                </div>

                {/* Telemetry quick indicators */}
                <div className="flex gap-3 text-xs font-mono">
                  <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 flex items-center gap-1.5">
                    <CloudSun className="h-4 w-4 text-saffron-radiance" />
                    <span>{realDest.temperature}</span>
                  </div>
                  <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-velvet-rose" />
                    <span className="capitalize">{realDest.crowdLevel} Density</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Sights & Monuments Columns */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Monuments Nearby */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-saffron-radiance" /> Nearby Monuments & Landmarks
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {realDest.monuments.map((mon) => (
                      <GlassCard key={mon.id} className="p-4 flex flex-col justify-between h-[230px] bg-white/2 border border-white/5 text-left">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] text-text-muted uppercase font-mono font-bold">Historical Site</span>
                            <span className="text-[10px] text-saffron-radiance font-bold flex items-center gap-0.5">
                              ⭐ {mon.rating}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1.5 truncate" title={mon.name}>{mon.name}</h4>
                          <p className="text-[10px] text-text-muted mt-1 leading-relaxed line-clamp-2">{mon.desc}</p>
                        </div>
                        
                        <div className="space-y-2 mt-3">
                          {/* Distance & Direction Bearing */}
                          <div className="text-[10px] font-mono text-saffron-radiance font-bold flex items-center gap-1 select-none">
                            <Navigation className="h-3.5 w-3.5 rotate-45 text-saffron-radiance" />
                            <span>🧭 {mon.distance} {mon.direction}</span>
                          </div>
                          
                          <div className="flex gap-1.5">
                            {/* Directions Button */}
                            <a
                              href={mon.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleShowRoute(mon.lat, mon.lng)}
                              className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all text-center"
                            >
                              Get Directions
                            </a>
                            <button
                              onClick={() => setActiveAR(true)}
                              className="flex-1 py-2 bg-velvet-rose/15 hover:bg-velvet-rose/30 text-white border border-velvet-rose/20 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all"
                            >
                              3D Scan
                            </button>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>

                {/* 2. Sights to Visit */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                    <Compass className="h-5 w-5 text-velvet-rose" /> Sights & Places to Visit Nearby
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {realDest.activities.map((act) => (
                      <GlassCard key={act.id} className="p-4 flex flex-col justify-between h-[200px] bg-white/2 border border-white/5 text-left">
                        <div>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Sightseeing</span>
                          <h4 className="text-sm font-bold text-white mt-1.5 truncate" title={act.name}>{act.name}</h4>
                          <p className="text-[10px] text-text-muted mt-1">Recommended daily excursion coordinates</p>
                        </div>
                        
                        <div className="space-y-2 mt-3">
                          {/* Distance & Direction Bearing */}
                          <div className="text-[10px] font-mono text-saffron-radiance font-bold flex items-center gap-1 select-none">
                            <Navigation className="h-3.5 w-3.5 rotate-45 text-saffron-radiance" />
                            <span>🧭 {act.distance} {act.direction}</span>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/5">
                            <a
                              href={act.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleShowRoute(act.lat, act.lng)}
                              className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all text-center"
                            >
                              Get Directions
                            </a>
                            <span className="text-white text-[10px] font-bold">₹{act.price} ticket</span>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>

                {/* 3. Hotels & Accommodations */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                    <Hotel className="h-5 w-5 text-green-400" /> Nearby Hotels, Stays & Rooms
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {realDest.hotels.map((hotel) => (
                      <GlassCard key={hotel.id} className="p-0 overflow-hidden bg-white/2 border border-white/5 text-left flex flex-col justify-between h-[310px]">
                        <div className="relative h-28 w-full overflow-hidden">
                          <img
                            src={hotel.imageUrl}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                          <span className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[8px] text-saffron-radiance font-bold">
                            ⭐ {hotel.rating}
                          </span>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] text-text-muted uppercase font-mono font-bold">{hotel.provider} verified</span>
                            <h4 className="text-xs font-bold text-white mt-1 truncate" title={hotel.name}>{hotel.name}</h4>
                            <p className="text-[10px] text-green-400 font-mono font-bold mt-0.5">₹{hotel.price}/night</p>
                          </div>

                          <div className="space-y-2 mt-3.5">
                            {/* Distance & Direction Bearing */}
                            <div className="text-[9px] font-mono text-saffron-radiance font-bold flex items-center gap-1 select-none">
                              <Navigation className="h-3.5 w-3.5 rotate-45 text-saffron-radiance" />
                              <span>🧭 {hotel.distance} {hotel.direction}</span>
                            </div>

                            <div className="flex gap-1.5 pt-2 border-t border-white/5">
                              <a
                                href={hotel.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleShowRoute(hotel.lat, hotel.lng)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all text-center"
                              >
                                Directions
                              </a>
                              
                              {isHotelInCart(hotel.id) ? (
                                <button
                                  onClick={() => {
                                    const idx = cartItems.findIndex(item => item.id === hotel.id);
                                    if (idx > -1) removeFromCart(idx);
                                  }}
                                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95 shadow-md"
                                >
                                  <Check className="h-3.5 w-3.5 animate-pulse" /> Booked
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAddHotelToCart(hotel)}
                                  className="flex-1 py-2 bg-velvet-rose hover:bg-red-700 text-white rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95 shadow-md"
                                >
                                  <Plus className="h-3.5 w-3.5" /> Book Room
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>

              </div>

              {/* Side bar Column */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* SOS emergency panel */}
                <GlassCard glowColor="rose" className="border border-red-500/25 bg-red-950/5 p-5 text-left">
                  <span className="text-[10px] text-red-500 font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 animate-pulse" /> Distress Broadcast Console
                  </span>
                  
                  <h3 className="text-sm font-bold text-white mt-2">Emergency SOS Portal</h3>
                  <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                    Triggering distress broadcasts sends your coordinates and traveler profile to the nearest police stations and emergency rooms.
                  </p>

                  <button
                    onClick={onTriggerSOS}
                    className="w-full mt-5 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg hover:scale-102 hover:shadow-red-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    🚨 Trigger Emergency SOS
                  </button>
                </GlassCard>

                {/* Google Maps Embedding */}
                <GlassCard hoverEffect={false} className="p-0 overflow-hidden h-[240px] flex flex-col justify-end bg-black relative border border-white/10">
                  <div className="absolute inset-0 z-0">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(120%)' }}
                      loading="lazy"
                      allowFullScreen
                      src={mapEmbedUrl || `https://maps.google.com/maps?q=${encodeURIComponent(realDest.name)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>

                  <div className="relative z-10 p-3 bg-midnight-obsidian/90 border-t border-white/10 text-left text-white flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                        Interactive Map: {realDest.name}
                      </h4>
                      <p className="text-[8px] text-text-muted">Live zoomable telemetry coordinates</p>
                    </div>
                    {mapEmbedUrl.includes('saddr') && (
                      <button
                        onClick={() => setMapEmbedUrl(`https://maps.google.com/maps?q=${encodeURIComponent(realDest.name)}&t=&z=12&ie=UTF8&iwloc=&output=embed`)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-bold text-white transition-all cursor-pointer"
                      >
                        Reset View
                      </button>
                    )}
                  </div>
                </GlassCard>

                {/* AI Itinerary CTA */}
                <button
                  onClick={() => setActiveView('itinerary')}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider shadow-lg hover:scale-102 transition-transform flex items-center justify-center gap-1.5"
                >
                  <Calendar className="h-4.5 w-4.5" /> Configure AI Itinerary
                </button>

              </div>

            </div>

            {/* Render active 3D scanner */}
            {activeAR && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full pt-8 border-t border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-saffron-radiance animate-ping" />
                    WebAR Active Scan: {realDest.name}
                  </h2>
                  <button 
                    onClick={() => setActiveAR(false)} 
                    className="text-xs text-text-muted hover:text-white"
                  >
                    Close Scanner
                  </button>
                </div>
                <ARView destinationName={realDest.name} />
              </motion.div>
            )}

          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
          >
            <div className="h-16 w-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-velvet-rose text-2xl animate-pulse">
              🔍
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display text-white">Dynamic Coordinate Explorer</h2>
              <p className="text-xs text-text-muted max-w-sm leading-relaxed">
                Enter any city or regional destination in the search bar above to fetch monuments, nearby sights, local hotels, and map telemetry coordinates.
              </p>
            </div>

            {/* Quick Demo links */}
            <div className="flex flex-wrap justify-center gap-2.5 pt-4">
              <span className="text-[10px] text-text-muted uppercase font-mono font-bold block w-full mb-1">Try searching a place</span>
              {['Varanasi', 'Hampi', 'Ladakh', 'Sydney', 'Paris'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSearchVal(p);
                    handleSearchSubmit();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white transition-all cursor-pointer"
                >
                  📍 {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
