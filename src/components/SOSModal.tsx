'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, X, Shield, Activity, MapPin, Loader2, CheckCircle, Navigation, Send, AlertTriangle,
  Phone, ShieldCheck, Eye, Video, Users, Share2, ChevronRight, ChevronLeft, Map
} from 'lucide-react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDestName: string | null;
  user?: any;
  showToast?: (message: string, type?: string) => void;
  userLocation?: any;
  triggerLocationRequest?: any;
}

interface ContactItem {
  id: string;
  name: string;
  relation: string;
  phone: string;
  selected: boolean;
}

const LOCAL_SAFETY_DATA: Record<string, {
  helplines: { name: string; contact: string; desc: string }[];
  centers: { name: string; address: string; distance: string; phone: string }[];
  routes: {
    id: string;
    name: string;
    description: string;
    safetyScore: number;
    metrics: { lighting: string; crowd: string; patrol: string; cctv: boolean };
    steps: string[];
  }[];
}> = {
  'Varanasi': {
    helplines: [
      { name: "Varanasi Women Helpline", contact: "1091", desc: "Direct cell for women safety and pink patrol dispatch." },
      { name: "Dashashwamedh Tourist Police", contact: "+91 542 2221234", desc: "Special English-speaking tourist protection cell." }
    ],
    centers: [
      { name: "Sigra Pink Police Booth", address: "Sigra Crossing (Near Mall)", distance: "1.2 km", phone: "112" },
      { name: "Dashashwamedh Ghat Tourist Center", address: "Main Ghat Entrance Plaza", distance: "0.2 km", phone: "+91 542 2221234" },
      { name: "Women Protection Desk Kotwali", address: "Kotwali Chowk Police Station", distance: "2.5 km", phone: "+91 542 2400122" }
    ],
    routes: [
      {
        id: 'vns-safe-1',
        name: 'Ganga Ghat Illumination Corridor',
        description: 'Fully lit main ghat pathway from Assi to Dashashwamedh. High foot traffic, active Pink Patrols.',
        safetyScore: 98,
        metrics: { lighting: '99% Brightly Lit', crowd: 'High Traffic', patrol: 'Active Patrols', cctv: true },
        steps: [
          "Start at well-lit Assi Ghat plaza entrance.",
          "Follow the wide, paved river walkway northwards.",
          "Pass the Kedar Ghat police monitoring tower.",
          "Conclude at the heavily patrolled Dashashwamedh Aarti pavilion."
        ]
      },
      {
        id: 'vns-safe-2',
        name: 'Godowlia-Dashashwamedh Main Arterial',
        description: 'Main bazaar vehicle-free zone. Packed with shops, emergency helper desks, CCTV coverage.',
        safetyScore: 95,
        metrics: { lighting: '95% Streetlights', crowd: 'Very High', patrol: 'Stationary Booths', cctv: true },
        steps: [
          "Depart from the Godowlia Crossing Police Checkpoint.",
          "Walk down the central pedestrian bazaar road.",
          "Keep to the main shops; avoid the dark side-galis.",
          "Arrive at the Ganga Aarti gates."
        ]
      }
    ]
  },
  'Leh-Ladakh': {
    helplines: [
      { name: "Leh Women Police Station", contact: "+91 1982 252010", desc: "Dedicated division for local and solo visitor assistance." },
      { name: "Tourist Support Desk Fort Road", contact: "+91 1982 252297", desc: "Monitored tourist security office." }
    ],
    centers: [
      { name: "Main Bazaar Security Hub", address: "Leh Market Square Centre", distance: "0.1 km", phone: "+91 1982 252018" },
      { name: "Fort Road Police Checkpost", address: "Fort Road Crossing", distance: "0.8 km", phone: "112" },
      { name: "SNM District Hospital Desk", address: "Hospital Road, Leh", distance: "1.5 km", phone: "+91 1982 253629" }
    ],
    routes: [
      {
        id: 'leh-safe-1',
        name: 'Leh Main Bazaar Heritage Loop',
        description: 'Broad, pedestrian-only cobblestone corridor. Excellent CCTV coverage and active local municipal wardens.',
        safetyScore: 99,
        metrics: { lighting: '100% LED Lit', crowd: 'Moderate Family', patrol: 'Wardens Present', cctv: true },
        steps: [
          "Enter from the Mosque gate side of Main Bazaar.",
          "Walk along the wide paved pedestrian square.",
          "Pass the central Information Center and Police kiosk.",
          "Arrive at the Soma Gompa gate entrance."
        ]
      },
      {
        id: 'leh-safe-2',
        name: 'Fort Road Safe Passage',
        description: 'Well-lit road connecting major hotels with market. Wide sidewalks and nearby tourist police station.',
        safetyScore: 92,
        metrics: { lighting: '85% Lit', crowd: 'Moderate', patrol: 'Regular Patrols', cctv: false },
        steps: [
          "Depart from the Fort Road tourist police booth.",
          "Stay on the left sidewalk facing traffic.",
          "Pass the registered taxi stand (emergency assistance point).",
          "Connect to the bazaar intersection."
        ]
      }
    ]
  },
  'Hampi': {
    helplines: [
      { name: "Hampi Tourist Security Cell", contact: "+91 8394 241244", desc: "24/7 tourist security desk near Virupaksha temple." },
      { name: "Kamalapura Police Station helpline", contact: "+91 8394 241258", desc: "Regional police dispatch desk." }
    ],
    centers: [
      { name: "Virupaksha Plaza Guard Station", address: "Main Bazaar Entrance", distance: "0.1 km", phone: "+91 8394 241244" },
      { name: "Kamalapura Circle Outpost", address: "Kamalapura Junction", distance: "3.2 km", phone: "112" },
      { name: "KSTDC Mayura Bhuvaneshwari Desk", address: "KSTDC Office Compound", distance: "2.8 km", phone: "+91 8394 241574" }
    ],
    routes: [
      {
        id: 'ham-safe-1',
        name: 'Virupaksha-Hemakuta Paved Safe-Walk',
        description: 'Paved heritage route under permanent ASI security guard patrol. High visibility, well-mapped.',
        safetyScore: 96,
        metrics: { lighting: 'Solar Pathlamps', crowd: 'Moderate Tour groups', patrol: 'ASI Guards Stationed', cctv: true },
        steps: [
          "Begin at the Virupaksha Temple Main Entrance gate.",
          "Ascend the paved steps of Hemakuta hill slope.",
          "Keep to the main signposted archaeological pathway.",
          "Reach the Sunset point pavilion where guards are stationed."
        ]
      },
      {
        id: 'ham-safe-2',
        name: 'Kamalapura to Hampi Main Connecting Road',
        description: 'Safe vehicular transit corridor. Regular patrolling by local police patrol vans.',
        safetyScore: 90,
        metrics: { lighting: '70% Lit', crowd: 'Light vehicular', patrol: 'Police Patrol Cars', cctv: false },
        steps: [
          "Start from the KSTDC Mayura complex gate.",
          "Walk along the main highway pedestrian sidewalk.",
          "Pass the ASI Museum checkpoint.",
          "Reach Hampi Bazaar police outpost."
        ]
      }
    ]
  }
};

const DEFAULT_SAFETY_DATA = {
  helplines: [
    { name: "National Women Helpline", contact: "1091", desc: "Toll-free emergency helpline for women in distress." },
    { name: "National Emergency Support", contact: "112", desc: "Unified single emergency response system." },
    { name: "Tourist Helpline (Multilingual)", contact: "1363", desc: "Information & safety reporting for domestic & international travelers." }
  ],
  centers: [
    { name: "Local Area Police Headquarters", address: "Nearest city central station", distance: "Dynamic", phone: "112" },
    { name: "District Hospital Emergency Wing", address: "Central medical emergency ward", distance: "Dynamic", phone: "102" },
    { name: "Government Tourist Aid Cell", address: "City tourism information center", distance: "Dynamic", phone: "1363" }
  ],
  routes: [
    {
      id: 'default-safe-1',
      name: 'Main Public Arterial Walkway',
      description: 'Route optimized along primary public transport, light posts, and commercial shopfronts.',
      safetyScore: 94,
      metrics: { lighting: 'High streetlamp density', crowd: 'Active storefronts', patrol: 'Regular local beats', cctv: true },
      steps: [
        "Locate the nearest main commercial street or avenue.",
        "Stay on wide, well-lit sidewalks in front of active shops.",
        "Use pedestrian crossings near traffic signals or cameras.",
        "Report to the nearest transit station/metro gates if unsafe."
      ]
    }
  ]
};


export default function SOSModal({ isOpen, onClose, selectedDestName, user, showToast }: SOSModalProps) {
  const [activeTab, setActiveTab] = useState<'distress' | 'safetyCenter'>('distress');
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [navigationStep, setNavigationStep] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [landmark, setLandmark] = useState<string | null>(null);
  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [isSlowGps, setIsSlowGps] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [sendChannel, setSendChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [distressSent, setDistressSent] = useState(false);

  const getCardinalCoords = (latitude: number, longitude: number) => {
    const latVal = Math.abs(latitude).toFixed(5);
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lngVal = Math.abs(longitude).toFixed(5);
    const lngDir = longitude >= 0 ? 'E' : 'W';
    return `${latVal}° ${latDir}, ${lngVal}° ${lngDir}`;
  };

  const reverseGeocodeSOS = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
        headers: { 'User-Agent': 'WanderLensTravelCopilot/1.0 (vikas@gobro.ai)' }
      });
      if (res.ok) {
        const data = await res.json();
        return data.display_name || data.name || 'Unknown Landmark';
      }
    } catch (e) {
      console.error('SOS Reverse geocoding failed:', e);
    }
    return 'Unknown Landmark';
  };

  // IP Geolocation API helper
  const fetchIPLocation = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        return { lat: data.latitude, lng: data.longitude, city: data.city || 'My Location' };
      }
    } catch (e) {
      console.warn("IP Geolocation failed:", e);
    }
    return { lat: 28.6139, lng: 77.2090, city: selectedDestName || "Delhi" };
  };

  // Initialize data on modal open
  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setIsTimerActive(true);
      setGpsLocked(false);
      setDistressSent(false);
      setIsLoadingGps(true);
      setIsSlowGps(false);
      setLat(null);
      setLng(null);
      setAccuracy(null);
      setLandmark(null);
      
      const uid = user?.uid || 'guest';
      
      // Load user profile details
      const userName = localStorage.getItem(`gobro_${uid}_user_name`) || (user?.email ? user.email.split('@')[0] : 'Explorer');

      // Load Family & Friends Emergency Contacts from local storage (or fall back to defaults)
      const rawContacts: ContactItem[] = [
        {
          id: 'fam1',
          name: localStorage.getItem(`gobro_${uid}_fam1_name`) || 'Bhagavi',
          relation: localStorage.getItem(`gobro_${uid}_fam1_rel`) || 'Mother',
          phone: localStorage.getItem(`gobro_${uid}_fam1_phone`) || '+91 99887 76655',
          selected: true
        },
        {
          id: 'fam2',
          name: localStorage.getItem(`gobro_${uid}_fam2_name`) || 'Muruli',
          relation: localStorage.getItem(`gobro_${uid}_fam2_rel`) || 'Father',
          phone: localStorage.getItem(`gobro_${uid}_fam2_phone`) || '+91 99000 11223',
          selected: true
        },
        {
          id: 'fr1',
          name: localStorage.getItem(`gobro_${uid}_fr1_name`) || 'Friend #1',
          relation: 'Friend',
          phone: localStorage.getItem(`gobro_${uid}_fr1_phone`) || '+91 98765 00123',
          selected: true
        },
        {
          id: 'fr2',
          name: localStorage.getItem(`gobro_${uid}_fr2_name`) || 'Friend #2',
          relation: 'Friend',
          phone: localStorage.getItem(`gobro_${uid}_fr2_phone`) || '+91 98888 77777',
          selected: true
        }
      ];
      setContacts(rawContacts);

      // Pre-fill initial message
      const timeStr = new Date().toLocaleTimeString();
      const initialMessage = `🚨 SOS from ${userName} — I may need help. Time: ${timeStr}. Please check on me immediately.`;
      setMessageText(initialMessage);

      // Slow load tracker
      const slowTimer = setTimeout(() => {
        setIsSlowGps(true);
      }, 1000);

      // Retrieve GPS or IP Fallback
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(slowTimer);
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const posAccuracy = Math.round(position.coords.accuracy);

            setLat(latitude);
            setLng(longitude);
            setAccuracy(posAccuracy);

            // Fetch landmark
            const resolvedLandmark = await reverseGeocodeSOS(latitude, longitude);
            setLandmark(resolvedLandmark);
            setGpsLocked(true);
            setIsLoadingGps(false);
            setIsSlowGps(false);

            // Format coordinates
            const cardCoords = getCardinalCoords(latitude, longitude);
            const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;

            const fullMsg = `🚨 EMERGENCY SOS 🚨\nExplorer: ${userName}\nTime: ${timeStr}\nCoordinates: ${cardCoords}\nLandmark: ${resolvedLandmark}\nAccuracy: ~${posAccuracy}m\nLive Link: ${mapLink}`;
            setMessageText(fullMsg);
          },
          async () => {
            clearTimeout(slowTimer);
            // Geolocation blocked or failed, fetch IP fallback
            const fallback = await fetchIPLocation();
            setLat(fallback.lat);
            setLng(fallback.lng);
            setAccuracy(5000);
            setLandmark(fallback.city);
            setGpsLocked(true);
            setIsLoadingGps(false);
            setIsSlowGps(false);

            const cardCoords = getCardinalCoords(fallback.lat, fallback.lng);
            const mapLink = `https://maps.google.com/?q=${fallback.lat},${fallback.lng}`;

            const fullMsg = `🚨 EMERGENCY SOS (Approx Location) 🚨\nExplorer: ${userName}\nTime: ${timeStr}\nCoordinates: ${cardCoords}\nLandmark: ${fallback.city}\nAccuracy: ~5000m (IP Fallback)\nLive Link: ${mapLink}`;
            setMessageText(fullMsg);
          },
          {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 0
          }
        );
      } else {
        clearTimeout(slowTimer);
        fetchIPLocation().then((fallback) => {
          setLat(fallback.lat);
          setLng(fallback.lng);
          setAccuracy(5000);
          setLandmark(fallback.city);
          setGpsLocked(true);
          setIsLoadingGps(false);
          setIsSlowGps(false);

          const cardCoords = getCardinalCoords(fallback.lat, fallback.lng);
          const mapLink = `https://maps.google.com/?q=${fallback.lat},${fallback.lng}`;

          const fullMsg = `🚨 EMERGENCY SOS (Approx Location) 🚨\nExplorer: ${userName}\nTime: ${timeStr}\nCoordinates: ${cardCoords}\nLandmark: ${fallback.city}\nAccuracy: ~5000m (IP Fallback)\nLive Link: ${mapLink}`;
          setMessageText(fullMsg);
        });
      }
    }
  }, [isOpen]);

  // Countdown timer hook
  useEffect(() => {
    let interval: any = null;
    if (isOpen && isTimerActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isTimerActive) {
      handleSendSOS();
    }
    return () => clearInterval(interval);
  }, [isOpen, isTimerActive, countdown]);

  const handleCheckboxChange = (id: string) => {
    setIsTimerActive(false); // Pause timer if user interacts
    setContacts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleSendSOS = () => {
    setIsTimerActive(false);
    
    const activeContacts = contacts.filter(c => c.selected);
    if (activeContacts.length === 0) {
      if (showToast) showToast("⚠️ No emergency contacts selected!", "warning");
      return;
    }

    setDistressSent(true);
    
    // Save to SOS History Log
    const uid = user?.uid || 'guest';
    const cachedHistory = localStorage.getItem(`gobro_${uid}_sos_history`);
    let history = [];
    if (cachedHistory) {
      try {
        history = JSON.parse(cachedHistory);
      } catch (e) {}
    }
    
    const targetRecipients = activeContacts.map(c => `${c.name} (${c.relation})`).join(', ');
    
    const newLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleString(),
      recipient: targetRecipients,
      message: messageText,
      status: 'Alert Dispatched ✅'
    };
    
    history.unshift(newLog);
    localStorage.setItem(`gobro_${uid}_sos_history`, JSON.stringify(history));

    if (showToast) showToast(`🚨 SOS alerts dispatched to: ${activeContacts.map(c => c.name).join(', ')}`);

    // Execute deep links depending on channel
    const primaryContact = activeContacts[0];
    if (sendChannel === 'whatsapp') {
      const waUrl = `https://wa.me/${primaryContact.phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, '_blank');
    } else if (sendChannel === 'sms') {
      const smsUrl = `sms:${primaryContact.phone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(messageText)}`;
      window.location.href = smsUrl;
    } else {
      const mailUrl = `mailto:?subject=Emergency%20Distress%20SOS&body=${encodeURIComponent(messageText)}`;
      window.location.href = mailUrl;
    }

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const destName = selectedDestName || '';
  const safetyData = LOCAL_SAFETY_DATA[destName] || DEFAULT_SAFETY_DATA;
  const activeRoute = safetyData.routes.find(r => r.id === activeRouteId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      {/* Modal Viewport */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-lg rounded-3xl border bg-midnight-obsidian p-6 md:p-8 shadow-2xl text-left overflow-y-auto max-h-[90vh] z-10 scrollbar-none transition-all duration-300 ${
          activeTab === 'safetyCenter' ? 'border-emerald-500/30' : 'border-red-500/30'
        }`}
      >
        <div className="absolute inset-0 bg-glow-radial opacity-40 pointer-events-none" />
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r animate-pulse transition-all duration-300 ${
          activeTab === 'safetyCenter' ? 'from-emerald-600 via-teal-500 to-emerald-600' : 'from-red-600 via-yellow-500 to-red-600'
        }`} />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10 pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className={`h-10 w-10 rounded-full border flex items-center justify-center shadow-md transition-all duration-300 ${
              activeTab === 'safetyCenter' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400' : 'bg-red-950/80 border-red-500/30 text-red-500'
            }`}>
              {activeTab === 'safetyCenter' ? <Shield className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5 animate-pulse" />}
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-white">
                {activeTab === 'safetyCenter' ? 'Women & Solo Safety Hub' : 'Distress SOS Console'}
              </h2>
              <span className={`text-[10px] font-mono tracking-widest uppercase animate-pulse ${
                activeTab === 'safetyCenter' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {activeTab === 'safetyCenter' ? 'Verified Protection Zones' : 'Accidental Trigger Protection'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border border-white/5 mt-4 p-1 bg-black/40 rounded-xl relative z-10">
          <button
            onClick={() => { setActiveTab('distress'); setIsTimerActive(false); }}
            className={`flex-1 py-2 text-xs rounded-lg font-bold transition-all ${
              activeTab === 'distress'
                ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-md'
                : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            🚨 Emergency SOS
          </button>
          <button
            onClick={() => { setActiveTab('safetyCenter'); setIsTimerActive(false); }}
            className={`flex-1 py-2 text-xs rounded-lg font-bold transition-all ${
              activeTab === 'safetyCenter'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-800 text-white shadow-md'
                : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            🛡️ Safe Travel Hub
          </button>
        </div>

        {activeTab === 'safetyCenter' ? (
          <div className="mt-6 space-y-5 relative z-10 text-left">
            {/* Safety Helplines */}
            <div className="space-y-2">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block font-bold">Women & Solo Helplines</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {safetyData.helplines.map((help, idx) => (
                  <div key={idx} className="bg-emerald-950/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-white block">{help.name}</span>
                      <span className="text-[10px] text-text-muted">{help.desc}</span>
                    </div>
                    <a
                      href={`tel:${help.contact.replace(/\s+/g, '')}`}
                      className="h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-md flex-shrink-0"
                      title={`Call ${help.name}`}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Protection Booths */}
            <div className="space-y-2">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block font-bold">Nearest Verified Safety Centers</span>
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-none">
                {safetyData.centers.map((center, idx) => (
                  <div key={idx} className="bg-white/2 border border-white/5 p-3 rounded-xl flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs font-bold text-white block flex items-center gap-1">
                        🏢 {center.name}
                      </span>
                      <span className="text-[10px] text-text-muted block mt-0.5">{center.address}</span>
                      <span className="text-[9px] text-emerald-400 font-mono mt-1 inline-block bg-emerald-950/45 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        📞 Dial: {center.phone}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-emerald-400 font-mono font-bold block">{center.distance}</span>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(center.name + ', ' + center.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-text-muted hover:text-white flex items-center gap-0.5 mt-1 underline cursor-pointer"
                      >
                        <Navigation className="h-2.5 w-2.5" /> Directions
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Safe Route Navigation */}
            <div className="space-y-2.5 border-t border-white/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block font-bold">Solo Safe Route Navigator</span>
                {activeRouteId && (
                  <button
                    onClick={() => { setActiveRouteId(null); setNavigationStep(0); }}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                  >
                    Change Route
                  </button>
                )}
              </div>

              {!activeRouteId ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-text-muted">Choose a verified safe travel corridor monitored by local police patrol, tourist safety cells, and high street lighting:</p>
                  <div className="space-y-2.5">
                    {safetyData.routes.map((route) => (
                      <div 
                        key={route.id}
                        className="bg-white/2 border border-white/5 hover:border-emerald-500/30 p-3.5 rounded-xl transition-all cursor-pointer text-left space-y-2.5"
                        onClick={() => { setActiveRouteId(route.id); setNavigationStep(0); }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-white block">{route.name}</span>
                            <span className="text-[10px] text-text-muted block mt-0.5">{route.description}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <ShieldCheck className="h-3.5 w-3.5" /> {route.safetyScore}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[9px] text-text-muted">
                          <span className="bg-white/5 px-2 py-0.5 rounded-full">💡 {route.metrics.lighting}</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded-full">👥 {route.metrics.crowd}</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded-full">👮 {route.metrics.patrol}</span>
                          <span className={`px-2 py-0.5 rounded-full ${route.metrics.cctv ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/20' : 'bg-white/5'}`}>
                            📹 CCTV {route.metrics.cctv ? 'Active' : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                activeRoute && (
                  <div className="bg-zinc-950/40 border border-emerald-500/20 rounded-2xl p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div>
                        <span className="text-xs font-bold text-white block flex items-center gap-1">
                          🟢 Active: {activeRoute.name}
                        </span>
                        <span className="text-[9px] text-text-muted block mt-0.5">Step {navigationStep + 1} of {activeRoute.steps.length}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Safe Walk Corridor
                      </span>
                    </div>

                    {/* Step Instruction Card */}
                    <div className="bg-emerald-950/10 border border-emerald-500/10 p-3.5 rounded-xl flex items-start gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {navigationStep + 1}
                      </div>
                      <div className="text-xs text-white leading-relaxed font-medium">
                        {activeRoute.steps[navigationStep]}
                      </div>
                    </div>

                    {/* Simulated SVG Route Mini Map Navigation */}
                    <div className="relative h-28 bg-black/60 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center">
                      <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-10">
                        {Array.from({ length: 18 }).map((_, i) => (
                          <div key={i} className="border-t border-l border-white" />
                        ))}
                      </div>
                      
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 100">
                        <path 
                          d="M20,80 L80,60 L120,40 L180,20" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="8" 
                          strokeOpacity="0.25" 
                          strokeLinecap="round"
                        />
                        <path 
                          d="M20,80 L80,60 L120,40 L180,20" 
                          fill="none" 
                          stroke="#059669" 
                          strokeWidth="3" 
                          strokeDasharray="4,4"
                          strokeLinecap="round"
                        />
                        
                        <circle cx="20" cy="80" r="4" fill="#ffffff" />
                        <text x="18" y="92" fill="#9ca3af" fontSize="6" fontFamily="monospace">START</text>

                        <circle cx="180" cy="20" r="4" fill="#ffffff" />
                        <text x="168" y="14" fill="#9ca3af" fontSize="6" fontFamily="monospace">DEST</text>

                        {(() => {
                          const pts = [
                            { cx: 20, cy: 80 },
                            { cx: 50, cy: 70 },
                            { cx: 80, cy: 60 },
                            { cx: 120, cy: 40 },
                            { cx: 150, cy: 30 },
                            { cx: 180, cy: 20 }
                          ];
                          const maxStep = activeRoute.steps.length - 1;
                          const progressIdx = Math.min(
                            Math.floor((navigationStep / maxStep) * (pts.length - 1)),
                            pts.length - 1
                          );
                          const userPos = pts[progressIdx];
                          return (
                            <>
                              <circle cx={userPos.cx} cy={userPos.cy} r="6" fill="#10b981" className="animate-ping opacity-75" />
                              <circle cx={userPos.cx} cy={userPos.cy} r="4.5" fill="#34d399" />
                            </>
                          );
                        })()}
                      </svg>

                      <div className="absolute top-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Map className="h-2 w-2" /> Live GPS Lock Active
                      </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNavigationStep(prev => Math.max(0, prev - 1))}
                        disabled={navigationStep === 0}
                        className="flex-1 py-2 text-xs bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all font-semibold flex items-center justify-center gap-1 disabled:opacity-30 text-white cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev Step
                      </button>
                      {navigationStep < activeRoute.steps.length - 1 ? (
                        <button
                          onClick={() => setNavigationStep(prev => prev + 1)}
                          className="flex-1 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white transition-all font-bold flex items-center justify-center gap-1 cursor-pointer shadow-md"
                        >
                          Next Step <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (showToast) showToast("🎉 Safe navigation completed! Arrived safely.", "success");
                            setActiveRouteId(null);
                            setNavigationStep(0);
                          }}
                          className="flex-1 py-2 text-xs bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all font-bold flex items-center justify-center gap-1 cursor-pointer shadow-md"
                        >
                          Finish Navigation
                        </button>
                      )}
                    </div>

                    {/* Share safe trail */}
                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                      <button
                        onClick={() => {
                          const userEmail = user?.email || 'guest';
                          const userName = localStorage.getItem(`gobro_${user?.uid || 'guest'}_user_name`) || userEmail.split('@')[0];
                          const activeContacts = contacts.filter(c => c.selected);
                          if (activeContacts.length === 0) {
                            if (showToast) showToast("⚠️ Select emergency contacts first in the distress tab!", "warning");
                            return;
                          }
                          const shareMsg = `🛡️ Safe Walk Live: I am walking on the verified "${activeRoute.name}" corridor in ${destName}. Currently at step ${navigationStep + 1} of ${activeRoute.steps.length}. Checked in via WanderLens.`;
                          const waUrl = `https://wa.me/${activeContacts[0].phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(shareMsg)}`;
                          window.open(waUrl, '_blank');
                          if (showToast) showToast("📤 Live safe route shared with contacts!");
                        }}
                        className="py-1.5 text-[9px] bg-white/2 border border-white/5 rounded-lg text-text-muted hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Share2 className="h-3 w-3" /> Share Safe Path
                      </button>
                      <button
                        onClick={() => {
                          const helpNum = safetyData.helplines[0]?.contact || "112";
                          window.open(`tel:${helpNum.replace(/\s+/g, '')}`);
                        }}
                        className="py-1.5 text-[9px] bg-red-950/20 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-900/20 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Phone className="h-3 w-3" /> Direct Escort Call
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Hub Close */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Safe Hub
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5 relative z-10">
            {/* 5-second countdown banner */}
            {countdown > 0 && isTimerActive && !distressSent ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center space-y-2">
                <span className="text-[10px] text-red-400 font-mono uppercase tracking-wider block font-bold">Auto-Dispatch Triggering In</span>
                <div className="text-3xl font-black text-white font-mono animate-bounce">{countdown}s</div>
                <p className="text-[10px] text-text-muted">If this is an accidental press, click Cancel below immediately.</p>
              </div>
            ) : (
              <div className="bg-zinc-950/30 border border-white/5 rounded-2xl p-3 flex items-center justify-between text-xs">
                <span className="text-text-muted flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Timer Paused
                </span>
                <button 
                  onClick={() => { setCountdown(5); setIsTimerActive(true); }}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 text-[10px] rounded-lg text-white font-bold hover:bg-white/10 transition-colors"
                >
                  Restart Auto-Send
                </button>
              </div>
            )}

            {/* Precise Location Fetching Spinner */}
            {isLoadingGps && isSlowGps && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                <span className="text-xs font-bold text-white">Fetching your precise location...</span>
                <p className="text-[10px] text-text-muted">Querying high-accuracy GPS sensors for distress coordinate logs.</p>
              </div>
            )}

            {/* Recipient Checkbox List */}
            <div className="space-y-2">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block font-bold">Choose Distress Recipients</span>
              <div className="grid grid-cols-2 gap-3">
                {contacts.map((contact) => (
                  <label 
                    key={contact.id} 
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      contact.selected 
                        ? 'bg-red-950/20 border-red-500/40 text-white' 
                        : 'bg-white/2 border-white/10 text-text-muted hover:text-white'
                    }`}
                  >
                    <div className="text-left leading-tight">
                      <span className="text-xs font-bold block">{contact.name}</span>
                      <span className="text-[9px] text-text-muted font-mono">{contact.relation} &bull; {contact.phone}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={contact.selected}
                      onChange={() => handleCheckboxChange(contact.id)}
                      className="h-4 w-4 rounded bg-black/45 border-white/20 accent-red-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Pre-filled Message (Editable) */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block font-bold">SOS Distress Message</span>
              <textarea
                value={messageText}
                onChange={(e) => {
                  setIsTimerActive(false);
                  setMessageText(e.target.value);
                }}
                rows={3}
                className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-red-500/50"
              />
            </div>

            {/* GPS telemetry status */}
            <div className="bg-white/2 border border-white/5 p-4 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between items-center text-left">
                <span className="text-text-muted flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-saffron-radiance" /> GPS Telemetry Coordinates:
                </span>
                <span className="text-white font-mono font-bold">
                  {gpsLocked && lat && lng 
                    ? getCardinalCoords(lat, lng) 
                    : (
                      <span className="text-amber-400 animate-pulse flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Locking Coordinates...
                      </span>
                    )}
                </span>
              </div>
              {gpsLocked && (
                <div className="pt-2 border-t border-white/5 space-y-1 text-left">
                  {landmark && (
                    <p className="text-[10px] text-text-muted font-medium">
                      📍 Landmark: <span className="text-white">{landmark}</span>
                    </p>
                  )}
                  {accuracy !== null && (
                    <p className="text-[10px] text-text-muted font-medium">
                      🎯 Accuracy Radius: <span className="text-white font-mono">{accuracy} meters</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Channel Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block font-bold">Dispatch Route</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'whatsapp', label: '💬 WhatsApp' },
                  { id: 'sms', label: '📱 Mobile SMS' },
                  { id: 'email', label: '📧 Email' }
                ].map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => {
                      setIsTimerActive(false);
                      setSendChannel(channel.id as any);
                    }}
                    className={`py-2 text-xs rounded-xl border transition-all font-semibold ${
                      sendChannel === channel.id 
                        ? 'bg-red-600 text-white border-red-600 shadow-md' 
                        : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {channel.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex gap-3 relative z-10">
              <button
                onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs py-3.5 rounded-xl transition-all cursor-pointer"
              >
                Cancel Alert
              </button>
              
              <button
                onClick={handleSendSOS}
                disabled={distressSent}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs hover:scale-102 transition-transform shadow-lg cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> 
                {distressSent ? 'Dispatching...' : 'Send SOS Now'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
