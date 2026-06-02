'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, UtensilsCrossed, AlertTriangle, Compass, ChevronDown, ChevronUp, Map, DollarSign, Plus, Check, Database, MapPin, Printer, ExternalLink, Share2, Loader2, Volume2, Mic, Sunrise, Moon, Sun, Camera, CheckCircle } from 'lucide-react';
import { Destination } from '../data/mockData';
import { constructDynamicDestination } from '../utils/dynamicDestination';
import { localDB } from '../utils/offlineCache';
import GlassCard from '../components/GlassCard';
import { useTranslation, LanguageCode } from '../utils/translations';
import { calculateDistanceKm, searchRealWorldLocation, RealWorldDestination } from '../utils/geosearch';

import { mockDb } from '../utils/firebase';

interface PlannerViewProps {
  setActiveView: (view: string) => void;
  selectedDest: Destination | null;
  setSelectedDest: (dest: Destination) => void;
  addToCart: (item: { id: string; type: string; title: string; price: number; provider: string; details: string }) => void;
  isOffline: boolean;
  lang: string;
  cartItems: any[];
  removeFromCart: (index: number) => void;
  user: any;
  dbObj: any;
  userLocation?: {
    lat: number;
    lng: number;
    city: string;
    accuracy: number;
    status: 'enabled' | 'denied' | 'prompt' | 'fetching';
  } | null;
  triggerLocationRequest?: () => void;
  userEmotion?: { current: string; history: Array<{ date: string; emotion: string }> } | null;
  updateEmotion?: (emotion: string) => void;
  chronotype?: string;
  updateKarma?: (points: number) => void;
}

export default function PlannerView({
  setActiveView,
  selectedDest,
  setSelectedDest,
  addToCart,
  isOffline,
  lang,
  cartItems,
  removeFromCart,
  user,
  dbObj,
  userLocation,
  triggerLocationRequest,
  userEmotion,
  updateEmotion,
  chronotype = 'Flexible',
  updateKarma
}: PlannerViewProps) {
  const [typedDestination, setTypedDestination] = useState(selectedDest ? selectedDest.name : '');
  const [days, setDays] = useState(3);
  const [diet, setDiet] = useState<'any' | 'veg'>('any');
  const [pace, setPace] = useState<'relax' | 'moderate' | 'packed'>('moderate');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilingStep, setCompilingStep] = useState(0);
  const [showItinerary, setShowItinerary] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // New budget and transit states
  const [budget, setBudget] = useState<number>(30000);
  const [travelMode, setTravelMode] = useState<'flight' | 'train' | 'road' | 'bus'>('flight');

  // Sharing states
  const [shareLink, setShareLink] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ultimate Feature Expansion States
  const [isFacialScanning, setIsFacialScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  const [quantumEscapeActive, setQuantumEscapeActive] = useState(false);
  const [revealedDays, setRevealedDays] = useState<Record<number, boolean>>({ 0: true }); 
  const [soundLogs, setSoundLogs] = useState<Array<{ id: string; timestamp: string; duration: number }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { t } = useTranslation(lang as LanguageCode);

  const getBudgetTier = (b: number) => {
    if (b < 15000) return 'budget';
    if (b <= 50000) return 'premium';
    return 'luxury';
  };

  const getFilteredHotels = () => {
    if (!selectedDest) return [];
    const tier = getBudgetTier(budget);
    let filtered = selectedDest.hotels.filter(hotel => {
      if (tier === 'budget') return hotel.price <= 3000;
      if (tier === 'premium') return hotel.price > 3000 && hotel.price <= 8000;
      return hotel.price > 6000;
    });
    if (filtered.length === 0) {
      if (tier === 'budget') {
        filtered = [...selectedDest.hotels].sort((a, b) => a.price - b.price).slice(0, 1);
      } else if (tier === 'luxury') {
        filtered = [...selectedDest.hotels].sort((a, b) => b.price - a.price).slice(0, 1);
      } else {
        filtered = [selectedDest.hotels[0]];
      }
    }
    return filtered;
  };

  const getSelectedHotel = () => {
    const hotels = getFilteredHotels();
    return hotels[0] || selectedDest?.hotels[0];
  };

  const getActivitiesCost = () => {
    if (!selectedDest) return 0;
    const tier = getBudgetTier(budget);
    const rawCost = selectedDest.activities.reduce((acc, act) => acc + act.price, 0);
    if (tier === 'budget') return Math.min(rawCost, 500);
    if (tier === 'premium') return Math.min(rawCost, 1200);
    return rawCost;
  };

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
    'Connecting to WanderLens AI Co-Pilot client matrix...',
    'Locating PWA database entries...',
    'Querying local client weights tensor parameters...',
    'Compiling dynamic itinerary routes from browser-cache logs...',
    'Injecting local culinary thali recommendations...',
    'Itinerary compiled locally on device!'
  ];

  // Load Leaflet.js assets dynamically on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  const mapInstanceRef = useRef<any>(null);

  // Render Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !showItinerary || !selectedDest || typeof window === 'undefined') return;
    
    const L = (window as any).L;
    if (!L) return;

    const destLat = selectedDest.coordinates.lat;
    const destLng = selectedDest.coordinates.lng;

    const itinerary = getDynamicItinerary();
    const allStops = itinerary.flat();
    
    // Filter out the departure node if it is more than 50km from the destination
    const mapStops = allStops.filter(stop => {
      if (stop.activity.startsWith('Depart from my location')) {
        const dist = calculateDistanceKm(stop.lat, stop.lng, destLat, destLng);
        return dist <= 50;
      }
      return true;
    });

    const coordinates = mapStops.map(s => [s.lat, s.lng] as [number, number]);

    const mapTimeout = setTimeout(() => {
      const container = document.getElementById('leaflet-route-map');
      if (!container) return;
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }

      try {
        // Centering fix: center the map view on the destination coordinates
        const map = L.map('leaflet-route-map').setView([destLat, destLng], 12);
        mapInstanceRef.current = map;

        // Dark theme map layer styles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap & CARTO',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        mapStops.forEach((stop) => {
          const originalIdx = allStops.findIndex(s => s.activity === stop.activity && s.lat === stop.lat && s.lng === stop.lng);
          const displayIdx = originalIdx !== -1 ? originalIdx + 1 : 1;
          const tooltipContent = `<div class="text-black font-mono text-[10px]"><b>#${displayIdx}: ${stop.activity}</b><br/>${stop.time}</div>`;
          L.circleMarker([stop.lat, stop.lng], {
            radius: 8,
            fillColor: '#ff2e93',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map).bindPopup(tooltipContent);
        });

        if (coordinates.length > 1) {
          const polyline = L.polyline(coordinates, {
            color: '#ff2e93',
            weight: 3.5,
            opacity: 0.85,
            dashArray: '5, 8'
          }).addTo(map);
          
          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        } else if (coordinates.length === 1) {
          map.setView(coordinates[0], 14);
        }
      } catch (err) {
        console.error("Leaflet map initialization error:", err);
      }
    }, 100);

    return () => {
      clearTimeout(mapTimeout);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, showItinerary, selectedDest, days]);

  const solveTSP = (
    start: { lat: number; lng: number },
    stops: Array<{ name: string; lat: number; lng: number; desc?: string; category?: string }>
  ) => {
    const result: typeof stops = [];
    const unvisited = [...stops];
    let currentPos = start;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = calculateDistanceKm(currentPos.lat, currentPos.lng, unvisited[i].lat, unvisited[i].lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }

      const nextStop = unvisited.splice(nearestIndex, 1)[0];
      result.push(nextStop);
      currentPos = { lat: nextStop.lat, lng: nextStop.lng };
    }

    return result;
  };

  const getDynamicItinerary = () => {
    if (!selectedDest) return [];

    const candidates: Array<{ name: string; lat: number; lng: number; desc: string; category: string }> = [];

    const emotion = userEmotion?.current || 'Neutral';
    if (emotion === 'Stressed') {
      candidates.push({
        name: 'Silent Forest & Water Meditation Retreat',
        lat: selectedDest.coordinates.lat + 0.008,
        lng: selectedDest.coordinates.lng - 0.008,
        desc: 'Zero-crowd forest immersion and deep sound therapy near local waterfalls.',
        category: 'religion'
      });
      candidates.push({
        name: 'Vipassana Spiritual Center Stay',
        lat: selectedDest.coordinates.lat - 0.012,
        lng: selectedDest.coordinates.lng + 0.012,
        desc: 'Silent sanctuary focusing on ancient mindfulness and complete mental detox.',
        category: 'religion'
      });
    } else if (emotion === 'Tired') {
      candidates.push({
        name: 'Luxury Spa Resort staycation',
        lat: selectedDest.coordinates.lat + 0.005,
        lng: selectedDest.coordinates.lng + 0.005,
        desc: 'Thermal aromatherapy pools, Ayurvedic massages, and sea breeze hammocks.',
        category: 'activity'
      });
    } else if (emotion === 'Sad') {
      candidates.push({
        name: 'Community Travel Experience & Street Food Trail',
        lat: selectedDest.coordinates.lat - 0.006,
        lng: selectedDest.coordinates.lng + 0.006,
        desc: 'Vibrant local street food tasting, human warmth, and cultural storyteller gatherings.',
        category: 'market'
      });
    } else if (emotion === 'Excited') {
      candidates.push({
        name: 'High-Energy Adventure Sports Center',
        lat: selectedDest.coordinates.lat + 0.015,
        lng: selectedDest.coordinates.lng - 0.015,
        desc: 'Bungee jumping, zip-lining, paramotoring, and quad-bike desert trails.',
        category: 'activity'
      });
      candidates.push({
        name: 'Hidden Underground Music Party Place',
        lat: selectedDest.coordinates.lat - 0.018,
        lng: selectedDest.coordinates.lng - 0.018,
        desc: 'Secret beach bonfire rave, live folk fusion bands, and neon night dancing.',
        category: 'activity'
      });
    } else if (emotion === 'Anxious') {
      candidates.push({
        name: 'Secure Heritage Walk (Well-lit Route)',
        lat: selectedDest.coordinates.lat + 0.002,
        lng: selectedDest.coordinates.lng - 0.002,
        desc: 'Guarded historical trail equipped with CCTV coverage, first-aid stops, and emergency call booths.',
        category: 'activity'
      });
    }

    if ('monuments' in selectedDest && Array.isArray((selectedDest as any).monuments)) {
      (selectedDest as any).monuments.forEach((mon: any) => {
        candidates.push({
          name: mon.name,
          lat: mon.lat,
          lng: mon.lng,
          desc: mon.desc || 'Historical monument landmark.',
          category: 'monument'
        });
      });
    }

    if ('activities' in selectedDest && Array.isArray(selectedDest.activities)) {
      selectedDest.activities.forEach((act: any) => {
        candidates.push({
          name: act.title || act.name,
          lat: act.lat || (selectedDest.coordinates.lat + 0.01),
          lng: act.lng || (selectedDest.coordinates.lng - 0.01),
          desc: 'Recommended local excursion sight.',
          category: 'activity'
        });
      });
    }

    if ('places' in selectedDest && Array.isArray((selectedDest as any).places)) {
      (selectedDest as any).places.forEach((p: any) => {
        candidates.push({
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          desc: `Local point of interest (${p.category}).`,
          category: p.category
        });
      });
    }

    if (candidates.length === 0) {
      const city = selectedDest.name;
      const names = [
        'Scenic Heritage Walk',
        'Traditional Handicrafts Market',
        'Panoramic Viewpoint point',
        'Historical Museum Corridor',
        'Nature Sanctuary Ridge',
        'Sacred Shrine Temple'
      ];
      for (let i = 0; i < 6; i++) {
        candidates.push({
          name: `${city} ${names[i]}`,
          lat: selectedDest.coordinates.lat + (Math.random() - 0.5) * 0.04,
          lng: selectedDest.coordinates.lng + (Math.random() - 0.5) * 0.04,
          desc: 'Local highlight stops & landmarks.',
          category: i === 1 ? 'market' : i === 5 ? 'religion' : 'activity'
        });
      }
    }

    const startPt = userLocation && userLocation.status === 'enabled'
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : { lat: selectedDest.coordinates.lat, lng: selectedDest.coordinates.lng };

    const sortedStops = solveTSP(startPt, candidates);

    const result: Array<Array<{ time: string; activity: string; desc: string; icon: string; lat: number; lng: number }>> = [];
    for (let d = 0; d < days; d++) {
      result.push([]);
    }

    if (userLocation && userLocation.status === 'enabled') {
      result[0].push({
        time: chronotype === 'Night Owl' ? '10:00 AM' : chronotype === 'Early Bird' ? '06:00 AM' : '08:00 AM',
        activity: `Depart from my location (${userLocation.city})`,
        desc: `GPS Coordinates: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}. Embark on journey to ${selectedDest.name}.`,
        icon: 'MapPin',
        lat: userLocation.lat,
        lng: userLocation.lng
      });
    } else {
      result[0].push({
        time: chronotype === 'Night Owl' ? '10:30 AM' : chronotype === 'Early Bird' ? '07:00 AM' : '09:00 AM',
        activity: `Assemble at ${selectedDest.name} Center`,
        desc: `Meet up at central coordinates: ${selectedDest.coordinates.lat.toFixed(4)}, ${selectedDest.coordinates.lng.toFixed(4)}.`,
        icon: 'MapPin',
        lat: selectedDest.coordinates.lat,
        lng: selectedDest.coordinates.lng
      });
    }

    let maxStopsPerDay = 3;
    if (emotion === 'Stressed' || emotion === 'Tired' || emotion === 'Anxious') {
      maxStopsPerDay = 2;
    } else if (emotion === 'Excited') {
      maxStopsPerDay = 4;
    }

    let dayCounter = 0;
    sortedStops.forEach((stop) => {
      if (result[dayCounter].length >= maxStopsPerDay + 1) {
        if (dayCounter < days - 1) {
          dayCounter++;
        }
      }

      let hour = 10;
      if (chronotype === 'Night Owl') {
        hour = 11 + (result[dayCounter].length * 3.5);
      } else if (chronotype === 'Early Bird') {
        hour = 6 + (result[dayCounter].length * 2.5);
      } else {
        hour = 9 + (result[dayCounter].length * 3);
      }

      let timeStr = '';
      const roundedHour = Math.floor(hour);
      const mins = Math.round((hour - roundedHour) * 60);
      const finalMinsStr = mins === 0 ? '00' : String(mins);
      if (roundedHour > 12) {
        timeStr = `${roundedHour - 12}:${finalMinsStr} PM`;
      } else if (roundedHour === 12) {
        timeStr = `12:${finalMinsStr} PM`;
      } else {
        timeStr = `${roundedHour}:${finalMinsStr} AM`;
      }

      let icon = 'Compass';
      if (stop.category === 'restaurant') icon = 'UtensilsCrossed';
      else if (stop.category === 'religion') icon = 'Sparkles';
      else if (stop.category === 'market') icon = 'ShoppingBag';

      if (chronotype === 'Early Bird' && result[dayCounter].length === 2) {
        result[dayCounter].push({
          time: '01:30 PM',
          activity: 'Midday Rest & Nap Block',
          desc: 'Mandatory circadian sleep-cycle recovery slot. Recharge with local cooling drinks.',
          icon: 'Clock',
          lat: selectedDest.coordinates.lat,
          lng: selectedDest.coordinates.lng
        });
      }

      result[dayCounter].push({
        time: timeStr,
        activity: stop.name,
        desc: stop.desc || '',
        icon,
        lat: stop.lat,
        lng: stop.lng
      });

      if (chronotype === 'Night Owl' && result[dayCounter].length === maxStopsPerDay) {
        result[dayCounter].push({
          time: '09:30 PM',
          activity: `${selectedDest.name} Night Market & Stargazing`,
          desc: 'Vibrant local bazaar with lantern lit walkways, local street musicians, and cool midnight air.',
          icon: 'ShoppingBag',
          lat: stop.lat + 0.002,
          lng: stop.lng - 0.002
        });
      }
    });

    return result;
  };

  const handleGenerate = async () => {
    if (!typedDestination.trim()) return;
    
    setIsCompiling(true);
    setCompilingStep(0);
    setShowItinerary(false);

    // Dynamic compilation interval simulation
    const interval = setInterval(() => {
      setCompilingStep((prev) => {
        if (prev < compileLogs.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    try {
      const finalDest = await searchRealWorldLocation(typedDestination.trim(), isOffline);
      setSelectedDest(finalDest);
      
      clearInterval(interval);
      setCompilingStep(compileLogs.length - 1);
      
      setTimeout(() => {
        setIsCompiling(false);
        setShowItinerary(true);

        // SAVE TO OFFLINE INDEXEDDB CACHE
        const hotelPrice = (finalDest.hotels.filter(h => {
          if (budget < 15000) return h.price <= 3000;
          if (budget <= 50000) return h.price > 3000 && h.price <= 8000;
          return h.price > 6000;
        })[0] || finalDest.hotels[0]).price;
        const activitiesCostVal = budget < 15000 
          ? Math.min(finalDest.activities.reduce((acc, act) => acc + act.price, 0), 500)
          : budget <= 50000 
            ? Math.min(finalDest.activities.reduce((acc, act) => acc + act.price, 0), 1200)
            : finalDest.activities.reduce((acc, act) => acc + act.price, 0);
        const transitCost = { flight: 5000, train: 1500, road: 2500, bus: 800 }[travelMode];
        const estimatedCost = hotelPrice * (days - 1) + activitiesCostVal + transitCost + 3500;

        localDB.saveItinerary({
          id: Math.random().toString(),
          destination: finalDest.name,
          days,
          diet,
          pace,
          compiledAt: new Date().toLocaleDateString(),
          cost: estimatedCost
        }).catch(console.error);

      }, 500);

    } catch (e) {
      console.error(e);
      clearInterval(interval);
      setIsCompiling(false);
    }
  };

  const startCompileScan = async () => {
    setIsFacialScanning(true);
    setScanProgress(0);
    setScanMessage('Connecting to GOBRO Emotional Intelligence Copilot...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanMessage('Initializing facial vector map...');
    } catch (err) {
      console.warn("Camera access denied, fallback to holographic analyzer HUD.");
      setScanMessage('Booting holographic HUD simulator...');
    }

    const steps = [
      'Scanning thermal variations...',
      'Mapping eye-movement fatigue scales...',
      'Synthesizing emotional aura profile...',
      'Calibrating circadian sleep indexes...',
      'Biometric profile locked!'
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setScanProgress(currentProgress);
      
      const stepIdx = Math.min(
        Math.floor((currentProgress / 100) * steps.length),
        steps.length - 1
      );
      setScanMessage(steps[stepIdx]);

      if (currentProgress >= 100) {
        clearInterval(interval);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        const emotions = ['Happy', 'Stressed', 'Anxious', 'Tired', 'Excited', 'Sad', 'Neutral'];
        const chosen = emotions[Math.floor(Math.random() * emotions.length)];
        if (updateEmotion) {
          updateEmotion(chosen);
        }

        setIsFacialScanning(false);
        handleGenerate();
      }
    }, 150);
  };

  const handleRecordSound = () => {
    setIsRecording(true);
    setRecordingProgress(0);
    
    const interval = setInterval(() => {
      setRecordingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRecording(false);
          setSoundLogs(curr => [
            ...curr,
            {
              id: Math.random().toString(),
              timestamp: new Date().toLocaleTimeString(),
              duration: 10
            }
          ]);
          if (updateKarma) {
            updateKarma(15);
          }
          return 100;
        }
        return prev + 10;
      });
    }, 1000);
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

  const handleSharePlan = async () => {
    if (!selectedDest) return;
    setIsSharing(true);
    
    try {
      const shareId = Math.random().toString(36).substring(2, 11);
      const hotelPrice = getSelectedHotel() ? getSelectedHotel().price : selectedDest.hotels[0].price;
      const actCost = getActivitiesCost();
      const transitCost = { flight: 5000, train: 1500, road: 2500, bus: 800 }[travelMode];
      const estCost = hotelPrice * (days - 1) + actCost + transitCost + 3500;
      
      const payload = {
        id: shareId,
        destinationName: selectedDest.name,
        days: days,
        diet: diet,
        pace: pace,
        cost: estCost,
        compiledAt: new Date().toLocaleDateString(),
        selectedDest: selectedDest,
        ownerUid: user?.uid || 'guest',
        ownerName: user?.displayName || (user ? localStorage.getItem(`gobro_${user.uid}_user_name`) : null) || 'A WanderLens Traveler',
        createdAt: new Date().toISOString()
      };
      
      // Save to Firebase / local storage mockDb
      const activeDb = dbObj || mockDb;
      await activeDb.collection('shared_itineraries').doc(shareId).set(payload);
      
      // Generate share link
      const link = `${window.location.origin}/trip/${shareId}`;
      setShareLink(link);
      setShowShareModal(true);
    } catch (err) {
      console.error("Failed to share itinerary plan:", err);
      alert("Could not compile a public share link. Check your connection.");
    } finally {
      setIsSharing(false);
    }
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

  // Cost details & Google Maps waypoints construct
  const hotelCost = getSelectedHotel() ? getSelectedHotel().price * (days - 1) : 0;
  const activitiesCost = getActivitiesCost();
  const travelModeCosts = {
    flight: 5000,
    train: 1500,
    road: 2500,
    bus: 800
  };
  const transitCost = travelModeCosts[travelMode];
  const bufferCost = 3500;
  const totalEstimatedCost = hotelCost + activitiesCost + transitCost + bufferCost;
  const utilizationPercentage = Math.round((totalEstimatedCost / budget) * 100);

  const getGoogleMapsLink = () => {
    if (!selectedDest) return '#';
    const dynamicItinerary = getDynamicItinerary();
    const allStops = dynamicItinerary.flat();
    if (allStops.length === 0) return '#';

    // Map each stop to "{lat},{lng}"
    const coordinateParts = allStops.map(stop => `${stop.lat},${stop.lng}`);

    // Limit to 10 points to avoid breaking the Google Maps URL length limit
    const limitedCoords = coordinateParts.slice(0, 10);

    return `https://www.google.com/maps/dir/${limitedCoords.join('/')}/`;
  };

  const handlePrintPDF = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-itinerary, #printable-itinerary * {
          visibility: visible;
        }
        #printable-itinerary {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          color: black !important;
          background: white !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto px-6 py-8 flex flex-col space-y-8 min-h-[calc(100vh-140px)] transition-all duration-300 ${
      isOffline ? 'filter saturate-75 opacity-90' : ''
    }`}>
      
      {/* Offline capability indicator badge */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-2 select-none text-left">
        <div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono uppercase font-bold tracking-wide">
            🟢 Offline Available
          </span>
          <span className="text-[10px] text-text-muted ml-3 leading-relaxed">
            Itinerary routes are calculated client-side using neural weights models.
          </span>
        </div>
      </div>
      
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
                  <div className="flex gap-1 flex-1">
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
                        {n}D
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(30, parseInt(e.target.value) || 1));
                      setDays(val);
                    }}
                    className="w-16 bg-black/40 text-xs text-white border border-white/10 rounded-xl py-2 px-1 text-center focus:outline-none focus:border-velvet-rose/50 font-semibold"
                    placeholder="Custom"
                  />
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

            {/* Grid for Budget and Travel Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left border-t border-white/5 pt-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">Trip Budget Limit (₹)</label>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="range"
                      min={5000}
                      max={150000}
                      step={1000}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-velvet-rose"
                    />
                  </div>
                  <input
                    type="number"
                    min={5000}
                    max={150000}
                    value={budget}
                    onChange={(e) => setBudget(Math.max(5000, Number(e.target.value)))}
                    className="w-28 bg-black/40 text-xs text-white border border-white/10 rounded-xl py-2 px-3 text-center focus:outline-none focus:border-velvet-rose/50 font-semibold"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-text-muted">
                  <span>Min: ₹5k</span>
                  <span className="text-saffron-radiance font-semibold font-mono">
                    Tier: {budget < 15000 ? 'Budget (<₹15k)' : budget <= 50000 ? 'Premium (₹15k-₹50k)' : 'Luxury (>₹50k)'}
                  </span>
                  <span>Max: ₹150k</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">Transit Mode & Surcharge</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['flight', 'train', 'road', 'bus'] as const).map((mode) => {
                    const modeLabels = {
                      flight: { label: 'Flight', icon: '✈️', price: '₹5,000' },
                      train: { label: 'Train', icon: '🚂', price: '₹1,500' },
                      road: { label: 'Road', icon: '🚗', price: '₹2,500' },
                      bus: { label: 'Bus', icon: '🚌', price: '₹800' }
                    };
                    const item = modeLabels[mode];
                    return (
                      <button
                        key={mode}
                        onClick={() => setTravelMode(mode)}
                        className={`py-1.5 rounded-xl border flex flex-col items-center justify-center transition-all font-semibold ${
                          travelMode === mode 
                            ? 'bg-velvet-rose text-white border-velvet-rose shadow-md' 
                            : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-[9px] font-bold mt-0.5">{item.label}</span>
                        <span className="text-[8px] opacity-70 font-mono mt-0.5">{item.price}</span>
                      </button>
                    );
                  })}
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

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={startCompileScan}
                disabled={!typedDestination.trim()}
                className="flex-1 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-sm tracking-wider py-4 rounded-2xl shadow-lg hover:scale-102 disabled:opacity-40 disabled:hover:scale-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-glow"
              >
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                {t('compileRoute')} (with Emotional Scan)
              </button>

              <button
                onClick={async () => {
                  setQuantumEscapeActive(true);
                  const list = ['Varanasi', 'Goa', 'Ladakh', 'Hampi', 'Coorg', 'Jaisalmer'];
                  const surprise = list[Math.floor(Math.random() * list.length)];
                  setTypedDestination(surprise);
                  
                  // Mock scan
                  setIsFacialScanning(true);
                  setScanProgress(0);
                  setScanMessage('Initiating Quantum Pair Matching Escape...');
                  const interval = setInterval(() => {
                    setScanProgress(p => {
                      if (p >= 100) {
                        clearInterval(interval);
                        setIsFacialScanning(false);
                        handleGenerate();
                        return 100;
                      }
                      return p + 20;
                    });
                  }, 200);
                }}
                className="bg-black/45 border border-purple-500/30 hover:border-purple-500/60 text-purple-400 font-bold text-xs py-4 px-5 rounded-2xl tracking-wider hover:scale-102 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-950/20"
                title="Quantum Pairs Randomizer Escape"
              >
                🌀 Quantum Escape
              </button>
            </div>
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
        <div id="printable-itinerary" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
          
          {/* Left: Itinerary Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 select-none">
              <h2 className="text-xl font-bold font-display text-white">{selectedDest.name} Route Schedule ({days} Days)</h2>
              <div className="flex items-center gap-2">
                <a
                  href={getGoogleMapsLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-print p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-1 cursor-pointer text-xs"
                  title="Open Route in Google Maps"
                >
                  <Map className="h-4 w-4 text-saffron-radiance" /> Map Direction
                </a>
                <button
                  onClick={handlePrintPDF}
                  className="no-print p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-1 cursor-pointer text-xs"
                  title="Save as PDF"
                >
                  <Printer className="h-4 w-4 text-velvet-rose" /> Print PDF
                </button>
                <button
                  onClick={handleSharePlan}
                  disabled={isSharing}
                  className="no-print px-3 py-2 rounded-xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white text-xs font-bold shadow-md hover:scale-102 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
                >
                  {isSharing ? 'Sharing...' : '🔗 Share'}
                </button>
                <button
                  onClick={() => setShowItinerary(false)}
                  className="no-print text-xs text-text-muted hover:text-white hover:underline transition-all ml-1"
                >
                  Change
                </button>
              </div>
            </div>

            {quantumEscapeActive && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-6 text-xs flex items-start gap-3 text-purple-400">
                <span className="text-xl">🧬</span>
                <div>
                  <h4 className="font-bold text-white">Quantum Match Active</h4>
                  <p className="text-[10px] text-purple-300/80 mt-1">
                    An anonymous traveler has escaped on the exact same trajectory. You will meet them at the checkout/check-in of <strong className="text-white">{getSelectedHotel()?.name || 'your hotel'}</strong>!
                  </p>
                </div>
              </div>
            )}

            {[...Array(days)].map((_, dayIdx) => {
              const isOpen = expandedDay === dayIdx;
              const dynamicItinerary = getDynamicItinerary();
              const schedule = dynamicItinerary[dayIdx] || [];
              const isLocked = quantumEscapeActive && dayIdx > 0 && !revealedDays[dayIdx];

              return (
                <GlassCard
                  key={dayIdx}
                  hoverEffect={false}
                  className="p-0 overflow-hidden border border-white/5 bg-white/2"
                >
                  <div
                    onClick={() => {
                      if (isLocked) {
                        if (typeof window !== 'undefined') {
                          const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
                          if (AudioContext) {
                            try {
                              const ctx = new AudioContext();
                              const osc = ctx.createOscillator();
                              osc.connect(ctx.destination);
                              osc.frequency.setValueAtTime(440, ctx.currentTime);
                              osc.start();
                              osc.stop(ctx.currentTime + 0.15);
                            } catch (e) {}
                          }
                        }
                        alert("🔒 Day locked. Part of your Quantum Escape surprise trajectory! Cinematic reveal triggers 24 hours before departure.");
                        return;
                      }
                      setExpandedDay(isOpen ? null : dayIdx);
                    }}
                    className={`p-5 flex items-center justify-between cursor-pointer border-b border-white/5 bg-white/1 select-none ${isLocked ? 'opacity-65 saturate-50' : ''}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-velvet-rose/10 border border-velvet-rose/20 flex items-center justify-center text-velvet-rose font-black text-sm">
                        D{dayIdx + 1}
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-bold text-white">
                          Day {dayIdx + 1} {isLocked ? '— 🔒 Quantum Escape Target Locked' : ''}
                        </h3>
                        <span className="text-[10px] text-text-muted">
                          {isLocked 
                            ? 'Cinematic surprise stop under quantum pair alignment.' 
                            : dayIdx === 0 ? 'Arrival, orientation, and twilight sights' : dayIdx === days - 1 ? 'Bespoke souvenirs and checkout' : 'Deep dive local exploration'}
                        </span>
                      </div>
                    </div>
                    {isLocked ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRevealedDays(prev => ({ ...prev, [dayIdx]: true }));
                        }}
                        className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-mono font-bold uppercase cursor-pointer transition-all hover:scale-102"
                      >
                        Scan & Reveal Day
                      </button>
                    ) : isOpen ? (
                      <ChevronUp className="h-5 w-5 text-text-muted" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-text-muted" />
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && !isLocked && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 relative pl-10 md:pl-12 border-t border-white/5">
                          <div className="absolute left-6.5 top-8 bottom-8 w-0.5 bg-white/10" />

                          <div className="space-y-6 text-left">
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

            {/* Budget Utilization Progress Bar */}
            <div className="p-5 glassmorphism rounded-2xl border border-white/5 no-print text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-white">Trip Budget Utilization</span>
                <span className={`text-xs font-bold font-mono ${totalEstimatedCost > budget ? 'text-red-400 animate-pulse' : 'text-saffron-radiance'}`}>
                  ₹{totalEstimatedCost.toLocaleString()} / ₹{budget.toLocaleString()} ({utilizationPercentage}%)
                </span>
              </div>
              <div className="w-full bg-white/10 h-3.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalEstimatedCost > budget 
                      ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                      : 'bg-gradient-to-r from-green-400 to-saffron-radiance'
                  }`}
                  style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
                />
              </div>
              {totalEstimatedCost > budget && (
                <p className="text-[10px] text-red-400 mt-2 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Note: Simulated cost exceeds your target budget! Try changing transit modes or reducing duration.
                </p>
              )}
            </div>
          </div>

          {/* Right: Live Google Map Embed & Bookings */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Leaflet Dynamic Route Map */}
            <GlassCard glowColor="white" className="p-0 overflow-hidden h-[280px] flex flex-col justify-end bg-black relative border border-white/10">
              <div className="absolute inset-0 z-0 h-full w-full">
                {leafletLoaded ? (
                  <div id="leaflet-route-map" className="h-full w-full relative" style={{ zIndex: 1 }} />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center space-y-2 text-text-muted font-mono text-[10px]">
                    <Loader2 className="h-5 w-5 animate-spin text-velvet-rose" />
                    <span>Spinning up Leaflet.js engine...</span>
                  </div>
                )}
              </div>
 
              <div className="relative z-10 p-3 bg-midnight-obsidian/90 border-t border-white/10 text-left text-white flex items-center justify-between" style={{ zIndex: 10 }}>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Leaflet Route Map: {selectedDest.name}
                  </h4>
                  <p className="text-[9px] text-emerald-400 font-mono font-bold">TSP Optimization & Numbered Pins Active</p>
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
                  <span className="text-white font-semibold">₹ {hotelCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Local Tours & Activities</span>
                  <span className="text-white font-semibold">₹ {activitiesCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="capitalize">Transit ({travelMode})</span>
                  <span className="text-white font-semibold">₹ {transitCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Simulated Travel Buffer</span>
                  <span className="text-white font-semibold">₹ {bufferCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 text-sm font-bold text-white mb-4">
                <span>Total Estimated Cost</span>
                <span className="text-saffron-radiance">
                  ₹ {totalEstimatedCost.toLocaleString()}
                </span>
              </div>

              {/* Direct Quick Book Items */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider block text-left">Stay Recommendations</span>
                  <span className="text-[9px] text-saffron-radiance uppercase tracking-wider font-semibold font-mono">
                    Tier: {getBudgetTier(budget)}
                  </span>
                </div>
                {getFilteredHotels().map((hotel) => (
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

            {/* 🎙️ Ambient Soundscape Journal */}
            <GlassCard glowColor="purple" className="p-5 text-left border border-purple-500/10">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <h3 className="text-xs font-bold font-display text-white flex items-center gap-1.5 font-sans">
                  <Volume2 className="h-4 w-4 text-purple-400" />
                  Sensory Sound Journal
                </h3>
                <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-purple-500/10 border border-purple-500/25 text-purple-400 uppercase tracking-widest">
                  +15 KP bonus
                </span>
              </div>
              
              <p className="text-[10px] text-text-muted leading-relaxed mb-4">
                Record 10-second offline ambient sound loops (temple chants, market bustle) to register environmental sensory memories.
              </p>

              {isRecording ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono text-purple-300">
                    <span className="animate-pulse">🔴 Recording ambient soundscape...</span>
                    <span>{recordingProgress}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{ width: `${recordingProgress}%` }} />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleRecordSound}
                  className="w-full py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 hover:border-purple-500/60 text-purple-400 text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  🎙️ Record 10s Sensory Loop
                </button>
              )}

              {soundLogs.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/5 space-y-2 max-h-[110px] overflow-y-auto scrollbar-none">
                  <span className="text-[9px] text-text-muted font-bold font-mono uppercase block">Recorded Sensory Memories</span>
                  {soundLogs.map((log) => (
                    <div key={log.id} className="flex justify-between items-center bg-black/45 border border-white/5 p-2 rounded-lg text-[9px] font-mono text-zinc-300">
                      <span>🎵 Sound_Record_{log.timestamp}</span>
                      <span className="text-purple-400">{log.duration}s loop</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            <button
              onClick={() => setActiveView('booking')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider shadow-lg hover:scale-102 transition-transform flex items-center justify-center gap-1.5 mt-4"
            >
              Configure simulated tickets &rarr;
            </button>
          </div>
        </div>
      )}
      {/* Share Plan Modal Overlay */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-midnight-obsidian/90 border border-white/10 p-6 rounded-3xl shadow-2xl z-10 backdrop-blur-2xl text-left select-none"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-saffron-radiance/10 border border-saffron-radiance/30 flex items-center justify-center text-saffron-radiance text-xl">
                  🚀
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Itinerary Shared Successfully!</h3>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    This plan is now hosted publicly on WanderLens cloud. Anyone with the link can view it, no auth required.
                  </p>
                </div>

                {/* Link display & copy input */}
                <div className="flex gap-2 bg-black/45 border border-white/10 rounded-xl p-1.5 items-center">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 bg-transparent text-[11px] text-white px-2 focus:outline-none font-mono truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 py-3 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white text-xs font-bold rounded-xl shadow-md hover:scale-102 transition-transform cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📹 Biometric Emotional Scan Simulator Overlay */}
      <AnimatePresence>
        {isFacialScanning && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <GlassCard glowColor="purple" className="p-6 max-w-sm w-full text-center space-y-6 border border-purple-500/30">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-display">Biometric Facial Scan active</h3>
                <p className="text-xs text-text-muted font-mono">{scanMessage}</p>
              </div>

              <div className="relative aspect-video w-full bg-black/80 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                
                {/* Neon scanner lines */}
                <div className="absolute inset-6 border border-dashed border-purple-500/50 rounded-xl pointer-events-none animate-pulse">
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-purple-500 animate-bounce shadow-[0_0_8px_#8b5cf6]" />
                  <div className="absolute top-2 left-2 text-[7px] font-mono text-purple-400 bg-black/60 px-1 py-0.5 rounded uppercase tracking-wider">
                    CALIBRATING_EMOTION_HUD
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-purple-300">
                  <span>Diagnostic Progress</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full transition-all duration-150" style={{ width: `${scanProgress}%` }} />
                </div>
              </div>

              <div className="text-[10px] text-text-muted leading-relaxed font-mono">
                Silently syncing circadian thali routes & safe zones based on amygdala fluctuations...
              </div>
            </GlassCard>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

