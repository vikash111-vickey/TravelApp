'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, MapPin, Calendar, Plus, Check, Compass, Landmark, Hotel, ShieldAlert, ArrowRight, Eye, Shield, Users, CloudSun, Sparkles, Navigation, Loader2 } from 'lucide-react';
import { Destination } from '../data/mockData';
import { searchRealWorldLocation, RealWorldDestination, calculateDistanceKm } from '../utils/geosearch';
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
  showToast?: (message: string, type?: string) => void;
  user?: any;
  dbObj?: any;
  userLocation?: {
    lat: number;
    lng: number;
    city: string;
    accuracy: number;
    status: 'enabled' | 'denied' | 'prompt' | 'fetching';
  } | null;
  triggerLocationRequest?: () => void;
  synesthesiaColor?: string;
  setSynesthesiaColor?: (color: string) => void;
  updateKarma?: (points: number) => void;
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
  onTriggerSOS,
  showToast,
  user,
  dbObj,
  userLocation,
  triggerLocationRequest,
  synesthesiaColor,
  setSynesthesiaColor,
  updateKarma
}: DiscoverViewProps) {
  const [searchVal, setSearchVal] = useState('');
  const [nearYouItems, setNearYouItems] = useState<any[]>([]);
  const [nearYouLoading, setNearYouLoading] = useState<boolean>(false);
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [activeAR, setActiveAR] = useState(false);
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');
  const [hotelTier, setHotelTier] = useState<'all' | 'budget' | 'premium' | 'luxury'>('all');

  // Sensory Map & Dream states
  const [showSensoryMap, setShowSensoryMap] = useState(false);
  const [synesthesiaMode, setSynesthesiaMode] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const sensoryMapData = [
    { name: 'Varanasi', sound: 90, smell: 85, texture: 'Flowing (Water)', color: '#f59e0b', description: 'Ancient chants, heavy temple bells, incense fires.', rating: 4.8, crowd: 'High Density' },
    { name: 'Hampi', sound: 20, smell: 25, texture: 'Rough (Stone)', color: '#f43f5e', description: 'Ruins, dry wind, quiet boulder valleys.', rating: 4.8, crowd: 'Low Density' },
    { name: 'Ladakh', sound: 10, smell: 15, texture: 'Rugged (Mountain)', color: '#0ea5e9', description: 'Silent cold winds, high peaks, monastery horns.', rating: 4.9, crowd: 'Very Low' },
    { name: 'Goa Beaches', sound: 75, smell: 45, texture: 'Smooth (Sand)', color: '#06b6d4', description: 'Waves rolling, seafood curries, market music.', rating: 4.6, crowd: 'Moderate' },
    { name: 'Coorg Estates', sound: 15, smell: 20, texture: 'Mossy (Forest)', color: '#10b981', description: 'Rain on leaves, cardamom notes, bird chirps.', rating: 4.7, crowd: 'Moderate' },
    { name: 'Rann of Kutch', sound: 5, smell: 10, texture: 'Flat (Salt)', color: '#ffffff', description: 'Total vacuum silence, salt crunching, white horizon.', rating: 4.8, crowd: 'Low' }
  ];

  const detectVibeQuery = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('floating') || q.includes('sky and water') || q.includes('salt flat') || q.includes('rann') || q.includes('kutch')) {
      return 'Rann of Kutch';
    }
    if (q.includes('ancient stone') || q.includes('jungle growing') || q.includes('hampi') || q.includes('corridors')) {
      return 'Hampi';
    }
    if (q.includes('invisible') || q.includes('crowd of color') || q.includes('camel') || q.includes('pushkar')) {
      return 'Pushkar';
    }
    if (q.includes('another planet') || q.includes('spiti') || q.includes('valley') || q.includes('cold desert')) {
      return 'Spiti Valley';
    }
    if (q.includes('spiritual') || q.includes('ghat') || q.includes('aarti') || q.includes('ganga') || q.includes('varanasi')) {
      return 'Varanasi';
    }
    if (q.includes('beach') || q.includes('scuba') || q.includes('andaman') || q.includes('turquoise')) {
      return 'Andaman Islands';
    }
    if (q.includes('coffee') || q.includes('coorg') || q.includes('green') || q.includes('misty')) {
      return 'Coorg';
    }
    if (q.includes('tea') || q.includes('munnar') || q.includes('estate') || q.includes('valley')) {
      return 'Munnar';
    }
    return query;
  };

  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (showToast) showToast("❌ Voice search is not supported in this browser.", "error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      if (showToast) showToast("🎙️ Listening to your dream description...");
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setSearchVal(speechToText);
      setIsListening(false);
      if (showToast) showToast(`📝 Transcribed dream: "${speechToText}"`, "success");
    };

    recognition.onerror = () => {
      setIsListening(false);
      if (showToast) showToast("❌ Voice recognition failed.", "error");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const playSyntheticSoundscape = (destName: string) => {
    if (typeof window === 'undefined') return;
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    try {
      const ctx = new AudioContext();
      
      if (destName.toLowerCase().includes('varanasi')) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); 
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2.5);
      } else if (destName.toLowerCase().includes('ladakh') || destName.toLowerCase().includes('spiti')) {
        const bufferSize = ctx.sampleRate * 2.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 6;
        filter.frequency.setValueAtTime(320, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 2.5);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      } else if (destName.toLowerCase().includes('goa') || destName.toLowerCase().includes('andaman')) {
        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.0);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Audio Synthesis blocked:", e);
    }
  };

  const fetchPlaces = async (searchTerm: string): Promise<any[]> => {
    if (isOffline) return [];
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'WanderLensTravelCopilot/1.0 (vikas@gobro.ai)' }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  };

  const getTravelTimes = (distKm: number) => {
    const walkingSpeed = 5;
    const drivingSpeed = 45;
    const walkTimeMin = Math.round((distKm / walkingSpeed) * 60);
    const driveTimeMin = Math.round((distKm / drivingSpeed) * 60);
    
    const formatTime = (minutes: number) => {
      if (minutes < 60) return `${minutes}m`;
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    };
    
    return {
      walk: formatTime(walkTimeMin),
      drive: formatTime(driveTimeMin)
    };
  };

  const renderRouteSummary = (userDist: number, destLat: number, destLng: number) => {
    const walkingSpeed = 5;
    const transitSpeed = 30;
    const drivingSpeed = 45;
    
    const formatTime = (hours: number) => {
      const totalMinutes = Math.round(hours * 60);
      if (totalMinutes < 60) return `${totalMinutes}m`;
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    };

    return (
      <div className="mt-3 p-3 rounded-2xl bg-black/60 border border-white/10 text-[10px] space-y-1.5 text-left">
        <div className="font-bold text-white flex items-center justify-between border-b border-white/5 pb-1">
          <span>📍 Route Details (from you)</span>
          <span className="text-saffron-radiance font-mono font-bold">{userDist.toFixed(1)} km</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-text-muted">
          <div>
            <span className="block text-[8px] font-semibold text-white/55">🚶 Walk</span>
            <span className="font-mono font-bold text-emerald-400">{formatTime(userDist / walkingSpeed)}</span>
          </div>
          <div>
            <span className="block text-[8px] font-semibold text-white/55">🚗 Drive</span>
            <span className="font-mono font-bold text-saffron-radiance">{formatTime(userDist / drivingSpeed)}</span>
          </div>
          <div>
            <span className="block text-[8px] font-semibold text-white/55">🚇 Transit</span>
            <span className="font-mono font-bold text-blue-400">{formatTime(userDist / transitSpeed)}</span>
          </div>
        </div>
        {userLocation && (
          <a
            href={`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${destLat},${destLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-2 py-1.5 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white rounded-xl text-[9px] font-bold flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98 transition-all text-center"
          >
            Navigate from My Location
          </a>
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchNearYou = async () => {
      if (!userLocation || userLocation.status !== 'enabled') {
        setNearYouItems([]);
        return;
      }
      setNearYouLoading(true);
      try {
        const city = userLocation.city || 'Delhi';
        
        let attractions: any[] = [];
        let restaurants: any[] = [];
        let hotels: any[] = [];
        let worships: any[] = [];
        let markets: any[] = [];

        if (!isOffline) {
          try {
            [attractions, restaurants, hotels, worships, markets] = await Promise.all([
              fetchPlaces(`attraction in ${city}`),
              fetchPlaces(`restaurant in ${city}`),
              fetchPlaces(`hotel in ${city}`),
              fetchPlaces(`place of worship in ${city}`),
              fetchPlaces(`market in ${city}`)
            ]);
          } catch (e) {
            console.warn("Failed to fetch Nominatim near you, falling back to mock generator", e);
          }
        }
        
        const items: any[] = [];
        
        attractions.forEach((item: any, idx: number) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon || item.lng);
          const name = item.display_name.split(',')[0];
          const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
          if (dist <= 10) {
            items.push({
              id: `near-attraction-${idx}`,
              name,
              category: 'monument',
              lat,
              lng,
              distance: dist,
              rating: 4.4 + (idx * 0.1),
              googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`
            });
          }
        });
        
        restaurants.forEach((item: any, idx: number) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon || item.lng);
          const name = item.display_name.split(',')[0];
          const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
          if (dist <= 10) {
            const cuisines = [['Street Food', 'Local Special'], ['Traditional Thali', 'Veg'], ['South Indian', 'Coffee']][idx % 3];
            items.push({
              id: `near-restaurant-${idx}`,
              name,
              category: 'restaurant',
              lat,
              lng,
              distance: dist,
              rating: 4.2 + (idx * 0.2),
              cuisineTags: cuisines,
              googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`
            });
          }
        });
        
        hotels.forEach((item: any, idx: number) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon || item.lng);
          const name = item.display_name.split(',')[0];
          const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
          if (dist <= 10) {
            items.push({
              id: `near-hotel-${idx}`,
              name,
              category: 'hotel',
              lat,
              lng,
              distance: dist,
              rating: 4.3 + (idx * 0.1),
              price: 1800 + (idx * 1500),
              provider: ['Booking.com', 'Airbnb', 'MakeMyTrip'][idx % 3],
              googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`
            });
          }
        });
        
        worships.forEach((item: any, idx: number) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon || item.lng);
          const name = item.display_name.split(',')[0];
          const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
          if (dist <= 10) {
            items.push({
              id: `near-worship-${idx}`,
              name,
              category: 'religion',
              lat,
              lng,
              distance: dist,
              rating: 4.6 + (idx * 0.1),
              googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`
            });
          }
        });
        
        markets.forEach((item: any, idx: number) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon || item.lng);
          const name = item.display_name.split(',')[0];
          const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
          if (dist <= 10) {
            items.push({
              id: `near-market-${idx}`,
              name,
              category: 'market',
              lat,
              lng,
              distance: dist,
              rating: 4.1 + (idx * 0.1),
              googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`
            });
          }
        });
        
        items.sort((a, b) => a.distance - b.distance);
        
        if (items.length === 0) {
          const fallbackCategories: Array<'monument' | 'restaurant' | 'hotel' | 'religion' | 'market' | 'offbeat'> = [
            'monument', 'restaurant', 'hotel', 'religion', 'market', 'offbeat'
          ];
          const names = [
            `Heritage Clock Tower`,
            `Local Spice Bistro`,
            `Grand Residency`,
            `Sacred Temple Mandir`,
            `Traditional Bazaars`,
            `Hidden Valley Viewpoint`
          ];
          for (let i = 0; i < 6; i++) {
            const lat = userLocation.lat + (Math.random() - 0.5) * 0.05;
            const lng = userLocation.lng + (Math.random() - 0.5) * 0.05;
            const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
            items.push({
              id: `near-fallback-${i}`,
              name: `${city} ${names[i]}`,
              category: fallbackCategories[i],
              lat,
              lng,
              distance: dist,
              rating: 4.4 + (i * 0.1),
              cuisineTags: fallbackCategories[i] === 'restaurant' ? ['Local', 'Traditional'] : undefined,
              price: fallbackCategories[i] === 'hotel' ? 2400 : undefined,
              provider: fallbackCategories[i] === 'hotel' ? 'Booking.com' : undefined,
              googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`
            });
          }
          items.sort((a, b) => a.distance - b.distance);
        }
        
        setNearYouItems(items.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch Near You items:", err);
      } finally {
        setNearYouLoading(false);
      }
    };
    
    fetchNearYou();
  }, [userLocation, isOffline]);

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
      localStorage.setItem('gobro_last_selected_dest', JSON.stringify(selectedDest));
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
    const resolvedSearchVal = detectVibeQuery(searchVal.trim());
    try {
      const dest = await searchRealWorldLocation(resolvedSearchVal, isOffline);
      setSelectedDest(dest);
      if (resolvedSearchVal !== searchVal.trim() && showToast) {
        showToast(`✨ AI Dream Decoder matched your vision to ${dest.name}!`, 'success');
      }
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
    if (hotel.name.toLowerCase().includes('eco') && updateKarma) {
      updateKarma(80);
      if (showToast) showToast(`🌿 Eco Karma Earned: +80 points for booking an Eco-Stay!`, 'success');
    } else {
      if (showToast) showToast(`🏨 Added ${hotel.name} to Bookings`);
    }
  };

  const handleAddPlaceToItinerary = (place: any) => {
    addToCart({
      id: place.id,
      type: 'Activity stop',
      title: place.name,
      price: 0,
      provider: 'Community Guide',
      details: `${place.category} - Rating: ${place.rating}⭐`
    });
    if (place.category === 'offbeat' && updateKarma) {
      updateKarma(40);
      if (showToast) showToast(`🌿 Eco-Karma Earned: +40 points for choosing offbeat gems!`, 'success');
    } else {
      if (showToast) showToast(`🗺️ Added ${place.name} to Itinerary`);
    }
  };

  const handleSaveDestination = () => {
    if (!realDest) return;
    const uid = user?.uid || 'guest';
    const cached = localStorage.getItem(`gobro_${uid}_favorite_destinations`);
    let favs: string[] = [];
    if (cached) {
      try {
        favs = JSON.parse(cached);
      } catch (e) {}
    }
    if (!favs.includes(realDest.id)) {
      favs.push(realDest.id);
      localStorage.setItem(`gobro_${uid}_favorite_destinations`, JSON.stringify(favs));
      
      // Update in Firestore if logged in
      if (user && dbObj) {
        dbObj.collection('users').doc(user.uid).set({
          favoriteDestinations: favs
        }, { merge: true }).catch((err: any) => console.error(err));
      }
      
      if (showToast) showToast("✅ Destination saved to wishlist");
    } else {
      if (showToast) showToast("ℹ️ Destination already in wishlist", "info");
    }
  };

  const realDest = selectedDest && ('monuments' in selectedDest) ? (selectedDest as unknown as RealWorldDestination) : null;

  return (
    <div className={`w-full max-w-7xl mx-auto px-6 py-8 flex flex-col space-y-8 transition-all duration-300 ${
      isOffline ? 'filter saturate-75 opacity-90' : ''
    }`}>
      
      {/* Offline capability indicator badge */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-2 select-none text-left">
        <div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono uppercase font-bold tracking-wide">
            🟢 Offline Available
          </span>
          <span className="text-[10px] text-text-muted ml-3 leading-relaxed">
            Monument database geosearching & local coordinate bearings operate offline.
          </span>
        </div>
      </div>
      
      {/* Search Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl border border-white/10 bg-midnight-obsidian/75 backdrop-blur-xl">
        <div className="flex items-center space-x-3 w-full md:max-w-md bg-black/45 px-3 py-2.5 rounded-2xl border border-white/10">
          <MapPin className="h-5 w-5 text-velvet-rose flex-shrink-0" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            placeholder="Search any place or describe a dream vibe..."
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-text-muted"
          />
          <button
            onClick={startSpeechRecognition}
            className={`p-1.5 hover:text-white transition-colors cursor-pointer text-xs ${isListening ? 'text-red-500 animate-pulse' : 'text-text-muted'}`}
            title="Describe Your Dream Vibe (Voice Input)"
          >
            🎙️
          </button>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setShowSensoryMap(!showSensoryMap);
              if (showToast) showToast(showSensoryMap ? "📡 Closed Sensory Dimension Map" : "🔮 Opened Sensory Dimension Map");
            }}
            className={`px-4 py-3 rounded-2xl font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              showSensoryMap 
                ? 'bg-purple-600 border-purple-500 text-white' 
                : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
            }`}
          >
            🎨 Sensory Map
          </button>
          <button
            onClick={handleSearchSubmit}
            className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98 transition-transform cursor-pointer"
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
      </div>

      {/* Sensory Map Graph */}
      {showSensoryMap && (
        <GlassCard glowColor="purple" className="p-6 text-left">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-white/5 pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                🔮 Sensory Dimension Map (Synesthesia Mode)
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Hover circles to hear ambient loops synthesized by Web Audio. Synesthesia color-shifts the entire app theme.
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl">
              <label className="text-[10px] font-bold text-white font-mono uppercase cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={synesthesiaMode}
                  onChange={(e) => {
                    setSynesthesiaMode(e.target.checked);
                    if (!e.target.checked && setSynesthesiaColor) {
                      setSynesthesiaColor('');
                    }
                  }}
                  className="rounded border-white/10 bg-black/40 text-velvet-rose focus:ring-0 cursor-pointer h-3.5 w-3.5"
                />
                Synesthesia Mode Color Shift
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Map Grid Plot */}
            <div className="md:col-span-2 relative bg-black/45 border border-white/5 rounded-2xl h-[320px] p-6 flex flex-col justify-between">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-[8px] font-mono text-saffron-radiance uppercase font-bold tracking-widest pointer-events-none">
                Smell: Spiced & Urban ▲
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[8px] font-mono text-saffron-radiance uppercase font-bold tracking-widest pointer-events-none">
                Smell: Fresh & Natural ▼
              </div>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-[8px] font-mono text-saffron-radiance uppercase font-bold tracking-widest pointer-events-none origin-left pl-12">
                ◄ Sound: Silent & Serene
              </div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 text-[8px] font-mono text-saffron-radiance uppercase font-bold tracking-widest pointer-events-none origin-right pr-12">
                Sound: Vibrant & Chaotic ►
              </div>

              <div className="absolute inset-x-6 top-1/2 h-0.5 bg-white/10 border-t border-dashed border-white/5" />
              <div className="absolute inset-y-6 left-1/2 w-0.5 bg-white/10 border-l border-dashed border-white/5" />

              <div className="relative w-full h-full">
                {sensoryMapData.map((item, idx) => {
                  const left = 10 + (item.sound / 100) * 80;
                  const top = 90 - (item.smell / 100) * 80;
                  
                  return (
                    <button
                      key={idx}
                      onMouseEnter={() => playSyntheticSoundscape(item.name)}
                      onClick={() => {
                        setSearchVal(item.name);
                        playSyntheticSoundscape(item.name);
                        if (synesthesiaMode && setSynesthesiaColor) {
                          setSynesthesiaColor(item.color);
                          if (showToast) showToast(`🎨 Synesthesia Active: UI theme color-shifted to ${item.name}!`, 'success');
                        } else {
                          if (showToast) showToast(`📍 Focused on ${item.name} sensory coordinate.`);
                        }
                      }}
                      className="absolute group transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-115 active:scale-95"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        zIndex: 10
                      }}
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center border font-bold text-[10px] text-white shadow-lg transition-shadow duration-300 font-mono"
                        style={{
                          backgroundColor: `${item.color}25`,
                          borderColor: item.color,
                          boxShadow: `0 0 14px ${item.color}45`
                        }}
                      >
                        {item.name.substring(0, 3).toUpperCase()}
                      </div>
                      
                      <span className="absolute left-1/2 transform -translate-x-1/2 mt-1.5 px-2 py-0.5 bg-black/90 text-[9px] font-mono text-white rounded border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {item.name} (⭐{item.rating})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid listings */}
            <div className="bg-white/2 border border-white/5 rounded-2xl p-4 flex flex-col justify-between text-xs space-y-4">
              <div className="space-y-3">
                <span className="text-[10px] text-saffron-radiance uppercase font-mono font-bold block">Sensory Index</span>
                <h4 className="text-sm font-bold text-white font-display">Ambient Soundscapes</h4>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Web Audio synthesizers simulate ambient rain, beach waves, and temple bells offline.
                </p>
                
                <div className="space-y-2 border-t border-white/5 pt-3 leading-relaxed text-left max-h-[170px] overflow-y-auto scrollbar-none">
                  {sensoryMapData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-white/2">
                      <span className="font-semibold text-white">{item.name}</span>
                      <span className="font-mono text-[9px] text-text-muted">
                        🔊 {item.sound}% Sound • 👃 {item.smell}% Smell
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[9px] font-mono text-text-muted text-center pt-2">
                🟢 Direct Synesthesia Gradients Enabled.
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Near You Section */}
      {userLocation && userLocation.status === 'enabled' && nearYouItems.length > 0 && (
        <div className="space-y-4 text-left border-b border-white/5 pb-6">
          <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Discover Near You (📍 {userLocation.city})
          </h2>
          {nearYouLoading ? (
            <div className="flex items-center gap-2 text-xs text-text-muted font-mono py-4">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Scanning nearby coordinates...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nearYouItems.map((item) => {
                const categoryIcons: Record<string, string> = {
                  monument: '🏛️',
                  restaurant: '🍽️',
                  hotel: '🏨',
                  religion: '🛕',
                  market: '🛍️',
                  offbeat: '💎'
                };
                
                const travelTimes = getTravelTimes(item.distance);
                const isExpanded = expandedMapId === item.id;
                
                return (
                  <GlassCard key={item.id} className="p-4 flex flex-col justify-between min-h-[220px] h-auto bg-white/2 border border-white/5 text-left">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-text-muted uppercase font-mono font-bold flex items-center gap-1">
                          <span>{categoryIcons[item.category] || '📍'}</span>
                          <span className="capitalize">{item.category}</span>
                        </span>
                        <span className="text-[10px] text-saffron-radiance font-bold flex items-center gap-0.5">
                          ⭐ {item.rating.toFixed(1)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5 truncate" title={item.name}>{item.name}</h4>
                      {item.cuisineTags && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.cuisineTags.map((tag: string, idx: number) => (
                            <span key={idx} className="bg-white/5 text-text-muted text-[8px] px-1.5 py-0.5 rounded border border-white/5 font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.price && (
                        <p className="text-[10px] text-green-400 font-mono font-bold mt-1">₹{item.price}/night</p>
                      )}
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5 select-none justify-between">
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3.5 w-3.5 rotate-45 text-emerald-400" />
                          <span>{item.distance.toFixed(1)} km away</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-white/50">
                          <span>🚶 {travelTimes.walk}</span>
                          <span>🚗 {travelTimes.drive}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5 pt-2 border-t border-white/5">
                        <a
                          href={item.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all text-center"
                        >
                          Navigate
                        </a>
                        <button
                          onClick={() => setExpandedMapId(isExpanded ? null : item.id)}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            isExpanded ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                          }`}
                        >
                          📍 Map
                        </button>
                        {item.category === 'hotel' ? (
                          <button
                            onClick={() => {
                              addToCart({
                                id: item.id,
                                type: 'Hotel stay',
                                title: item.name,
                                price: item.price,
                                provider: item.provider,
                                details: `Rating: ${item.rating}⭐ (Near You)`
                              });
                              if (showToast) showToast(`🏨 Added ${item.name} to Bookings`);
                            }}
                            className="flex-1 py-2 bg-velvet-rose hover:bg-red-700 text-white rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            Book
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              addToCart({
                                id: item.id,
                                type: 'Activity stop',
                                title: item.name,
                                price: 0,
                                provider: 'Community Guide',
                                details: `${item.category} - Rating: ${item.rating}⭐`
                              });
                              if (showToast) showToast(`🗺️ Added ${item.name} to Itinerary`);
                            }}
                            className="flex-1 py-2 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer"
                          >
                            Add Stop
                          </button>
                        )}
                      </div>
                      
                      {isExpanded && (
                        <div className="w-full h-32 rounded-xl overflow-hidden mt-2 border border-white/10 relative">
                          <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(120%)' }}
                            loading="lazy"
                            allowFullScreen
                            src={`https://maps.google.com/maps?q=${item.lat},${item.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                          />
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <h1 className="font-display font-extrabold text-3xl md:text-5xl">{realDest.name}</h1>
                    <button
                      onClick={handleSaveDestination}
                      className="px-3.5 py-1.5 rounded-full bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-lg"
                      title="Save to favorites wishlist"
                    >
                      ❤️ Wishlist
                    </button>
                  </div>
                  <p className="text-xs text-text-muted mt-1 max-w-xl leading-relaxed">{realDest.description}</p>
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
                    {realDest.monuments.map((mon) => {
                      const userDist = userLocation && userLocation.status === 'enabled'
                        ? calculateDistanceKm(userLocation.lat, userLocation.lng, mon.lat, mon.lng)
                        : null;
                      const isExpanded = expandedMapId === mon.id;
                      return (
                        <GlassCard key={mon.id} className="p-4 flex flex-col justify-between min-h-[230px] h-auto bg-white/2 border border-white/5 text-left">
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
                            <div className="text-[10px] font-mono text-saffron-radiance font-bold flex flex-col gap-0.5 select-none">
                              <div className="flex items-center gap-1">
                                <Navigation className="h-3.5 w-3.5 rotate-45 text-saffron-radiance" />
                                <span>🧭 {mon.distance} {mon.direction}</span>
                              </div>
                              {userDist !== null && (
                                <span className="text-[9px] text-emerald-400">({userDist.toFixed(1)} km from you)</span>
                              )}
                            </div>
                            
                            {userDist !== null && renderRouteSummary(userDist, mon.lat, mon.lng)}
                            
                            <div className="flex gap-1.5 mt-2">
                              {/* Directions Button */}
                              <a
                                href={mon.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleShowRoute(mon.lat, mon.lng)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all text-center"
                              >
                                Directions
                              </a>
                              <button
                                onClick={() => setExpandedMapId(isExpanded ? null : mon.id)}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                  isExpanded ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                }`}
                              >
                                📍 Map
                              </button>
                              <button
                                onClick={() => setActiveAR(true)}
                                className="flex-1 py-2 bg-velvet-rose/15 hover:bg-velvet-rose/30 text-white border border-velvet-rose/20 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer"
                              >
                                3D Scan
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="w-full h-32 rounded-xl overflow-hidden mt-2 border border-white/10 relative">
                                <iframe
                                  width="100%"
                                  height="100%"
                                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(120%)' }}
                                  loading="lazy"
                                  allowFullScreen
                                  src={`https://maps.google.com/maps?q=${mon.lat},${mon.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                />
                              </div>
                            )}
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Sights to Visit */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                    <Compass className="h-5 w-5 text-velvet-rose" /> Sights & Places to Visit Nearby
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {realDest.activities.map((act) => {
                      const userDist = userLocation && userLocation.status === 'enabled'
                        ? calculateDistanceKm(userLocation.lat, userLocation.lng, act.lat, act.lng)
                        : null;
                      const isExpanded = expandedMapId === act.id;
                      return (
                        <GlassCard key={act.id} className="p-4 flex flex-col justify-between min-h-[200px] h-auto bg-white/2 border border-white/5 text-left">
                          <div>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Sightseeing</span>
                            <h4 className="text-sm font-bold text-white mt-1.5 truncate" title={act.name}>{act.name}</h4>
                            <p className="text-[10px] text-text-muted mt-1">Recommended daily excursion coordinates</p>
                          </div>
                          
                          <div className="space-y-2 mt-3">
                            {/* Distance & Direction Bearing */}
                            <div className="text-[10px] font-mono text-saffron-radiance font-bold flex flex-col gap-0.5 select-none">
                              <div className="flex items-center gap-1">
                                <Navigation className="h-3.5 w-3.5 rotate-45 text-saffron-radiance" />
                                <span>🧭 {act.distance} {act.direction}</span>
                              </div>
                              {userDist !== null && (
                                <span className="text-[9px] text-emerald-400">({userDist.toFixed(1)} km from you)</span>
                              )}
                            </div>
 
                            {userDist !== null && renderRouteSummary(userDist, act.lat, act.lng)}

                            <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/5 mt-2">
                              <a
                                href={act.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleShowRoute(act.lat, act.lng)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all text-center"
                              >
                                Directions
                              </a>
                              <button
                                onClick={() => setExpandedMapId(isExpanded ? null : act.id)}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                  isExpanded ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                }`}
                              >
                                📍 Map
                              </button>
                              <span className="text-white text-[10px] font-bold">₹{act.price} ticket</span>
                            </div>

                            {isExpanded && (
                              <div className="w-full h-32 rounded-xl overflow-hidden mt-2 border border-white/10 relative">
                                <iframe
                                  width="100%"
                                  height="100%"
                                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(120%)' }}
                                  loading="lazy"
                                  allowFullScreen
                                  src={`https://maps.google.com/maps?q=${act.lat},${act.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                />
                              </div>
                            )}
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
                {/* Dedicated Nearby Places Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                    🍴 Nearby Dining & Points of Interest
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {realDest.places && realDest.places.map((place) => {
                      const categoryIcons: Record<string, string> = {
                        restaurant: '🍽️',
                        religion: '🛕',
                        market: '🛍️',
                        offbeat: '💎'
                      };
                      const userDist = userLocation && userLocation.status === 'enabled'
                        ? calculateDistanceKm(userLocation.lat, userLocation.lng, place.lat, place.lng)
                        : null;
                      const isExpanded = expandedMapId === place.id;
                      return (
                        <GlassCard key={place.id} className="p-4 flex flex-col justify-between min-h-[205px] h-auto bg-white/2 border border-white/5 text-left">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] text-text-muted uppercase font-mono font-bold flex items-center gap-1">
                                <span>{categoryIcons[place.category] || '📍'}</span>
                                <span className="capitalize">{place.category}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 font-bold uppercase">
                                  {place.openStatus}
                                </span>
                                <span className="text-[10px] text-saffron-radiance font-bold flex items-center gap-0.5">
                                  ⭐ {place.rating}
                                </span>
                              </div>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-2 truncate" title={place.name}>{place.name}</h4>
                            
                            {/* Cuisine Tags for Restaurants */}
                            {place.category === 'restaurant' && place.cuisineTags && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {place.cuisineTags.map((tag, idx) => (
                                  <span key={idx} className="bg-white/5 text-text-muted text-[8px] px-1.5 py-0.5 rounded border border-white/5 font-medium">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {place.category !== 'restaurant' && (
                              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                                {place.category === 'religion' ? 'Popular spiritual site within 5km radius.' : place.category === 'market' ? 'Local bazaar & shopping streets.' : 'Offbeat hidden gem / scenic location.'}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2 mt-3">
                            <div className="text-[10px] font-mono text-saffron-radiance font-bold flex flex-col gap-0.5 select-none">
                              <div className="flex items-center gap-1">
                                <Navigation className="h-3.5 w-3.5 rotate-45 text-saffron-radiance" />
                                <span>🧭 {place.distance} {place.direction}</span>
                              </div>
                              {userDist !== null && (
                                <span className="text-[9px] text-emerald-400">({userDist.toFixed(1)} km from you)</span>
                              )}
                            </div>
                            
                            {userDist !== null && renderRouteSummary(userDist, place.lat, place.lng)}
                            
                            <div className="flex gap-1.5 mt-2">
                              <a
                                href={place.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleShowRoute(place.lat, place.lng)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all text-center"
                              >
                                Directions
                              </a>
                              <button
                                onClick={() => setExpandedMapId(isExpanded ? null : place.id)}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                  isExpanded ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                }`}
                              >
                                📍 Map
                              </button>
                              <button
                                onClick={() => handleAddPlaceToItinerary(place)}
                                className="flex-1 py-2 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer"
                              >
                                Add Stop
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="w-full h-32 rounded-xl overflow-hidden mt-2 border border-white/10 relative">
                                <iframe
                                  width="100%"
                                  height="100%"
                                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(120%)' }}
                                  loading="lazy"
                                  allowFullScreen
                                  src={`https://maps.google.com/maps?q=${place.lat},${place.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                />
                              </div>
                            )}
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Hotels & Accommodations / Stay Options */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <Hotel className="h-5 w-5 text-green-400" /> Stay Options
                    </h2>
                    
                    {/* Stay Tier Filters */}
                    <div className="flex border border-white/10 rounded-xl bg-black/45 p-1 text-[9px] md:text-[10px]">
                      {(['all', 'budget', 'premium', 'luxury'] as const).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => setHotelTier(tier)}
                          className={`px-2.5 py-1 rounded-lg capitalize transition-colors font-semibold cursor-pointer ${
                            hotelTier === tier ? 'bg-green-600 text-white shadow-md' : 'text-text-muted hover:text-white'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {realDest.hotels && realDest.hotels
                      .filter((hotel) => {
                        if (hotelTier === 'all') return true;
                        if (hotelTier === 'budget') return hotel.price <= 3000;
                        if (hotelTier === 'premium') return hotel.price > 3000 && hotel.price <= 8000;
                        if (hotelTier === 'luxury') return hotel.price > 8000;
                        return true;
                      })
                      .map((hotel) => {
                        // Dynamize amenity chips based on price/tier
                        const amenities = hotel.price <= 3000 
                          ? ['WiFi'] 
                          : hotel.price <= 8000 
                            ? ['WiFi', 'Breakfast'] 
                            : ['WiFi', 'Breakfast', 'Pool'];
                        const userDist = userLocation && userLocation.status === 'enabled'
                          ? calculateDistanceKm(userLocation.lat, userLocation.lng, hotel.lat, hotel.lng)
                          : null;
                        const isExpanded = expandedMapId === hotel.id;

                        return (
                          <GlassCard key={hotel.id} className="p-0 overflow-hidden bg-white/2 border border-white/5 text-left flex flex-col justify-between min-h-[340px] h-auto pb-4">
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
                                
                                {/* Amenity chips */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {amenities.map((amenity, idx) => (
                                    <span key={idx} className="bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wide uppercase">
                                      {amenity}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2 mt-3">
                                {/* Distance & Direction Bearing */}
                                <div className="text-[9px] font-mono text-saffron-radiance font-bold flex flex-col gap-0.5 select-none">
                                  <div className="flex items-center gap-1">
                                    <Navigation className="h-3.5 w-3.5 rotate-45 text-saffron-radiance" />
                                    <span>🧭 {hotel.distance} {hotel.direction}</span>
                                  </div>
                                  {userDist !== null && (
                                    <span className="text-[9px] text-emerald-400">({userDist.toFixed(1)} km from you)</span>
                                  )}
                                </div>

                                {userDist !== null && renderRouteSummary(userDist, hotel.lat, hotel.lng)}

                                <div className="flex gap-1.5 pt-2 border-t border-white/5 mt-2">
                                  <a
                                    href={hotel.googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleShowRoute(hotel.lat, hotel.lng)}
                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all text-center"
                                  >
                                    Directions
                                  </a>
                                  <button
                                    onClick={() => setExpandedMapId(isExpanded ? null : hotel.id)}
                                    className={`flex-1 py-2 rounded-xl text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                      isExpanded ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                    }`}
                                  >
                                    📍 Map
                                  </button>
                                  
                                  {isHotelInCart(hotel.id) ? (
                                    <button
                                      onClick={() => {
                                        const idx = cartItems.findIndex(item => item.id === hotel.id);
                                        if (idx > -1) {
                                          removeFromCart(idx);
                                          if (showToast) showToast(`❌ Removed ${hotel.name} from Bookings`, 'warning');
                                        }
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
                                      <Plus className="h-3.5 w-3.5" /> Book
                                    </button>
                                  )}
                                </div>

                                {isExpanded && (
                                  <div className="w-full h-32 rounded-xl overflow-hidden mt-2 border border-white/10 relative">
                                    <iframe
                                      width="100%"
                                      height="100%"
                                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(120%)' }}
                                      loading="lazy"
                                      allowFullScreen
                                      src={`https://maps.google.com/maps?q=${hotel.lat},${hotel.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </GlassCard>
                        );
                      })}
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
                <ARView 
                  destinationName={realDest.name} 
                  userLocation={userLocation}
                  showToast={showToast}
                />
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
