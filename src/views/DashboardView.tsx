import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, Calendar, Camera, ChevronRight, Database, History, RefreshCw, Bookmark, ArrowRight, Video, AlertCircle, Play, CheckCircle, Brain, Volume2, Moon, Sun, Sunrise, Heart, Mic } from 'lucide-react';
import { Destination, DESTINATIONS as ALL_DESTS, ARCHETYPES } from '../data/mockData';
import { constructDynamicDestination } from '../utils/dynamicDestination';
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
  setSelectedDest: (dest: Destination) => void;
  isOffline: boolean;
  user: any;
  userArchetype: string;
  profile?: { displayName: string; email: string; photoURL: string } | null;
  userEmotion?: { current: string; history: Array<{ date: string; emotion: string }> } | null;
  updateEmotion?: (emotion: string) => void;
  chronotype?: string;
  updateChronotype?: (chrono: string) => void;
  culturalPassport?: {
    stamps: string[];
    challenges: Record<string, boolean>;
    dnaProfile: { spiritual: number; heritage: number; nature: number };
  } | null;
  updatePassport?: (updater: (prev: any) => any) => void;
}

const POLAROID_IMAGES = [
  { id: 'p1', title: 'Ganga Aarti Mystique', url: 'https://images.unsplash.com/photo-1601999109332-542b18dbec57?auto=format&fit=crop&w=600&q=80' },
  { id: 'p2', title: 'Himalayan Pass Roads', url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&q=80' },
  { id: 'p3', title: 'Palolem Beach Sunsets', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { id: 'p4', title: 'Misty Cardamom Estates', url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80' }
];

export default function DashboardView({
  setActiveView,
  upcomingTrips,
  selectedDest,
  setSelectedDest,
  isOffline,
  user,
  userArchetype,
  profile,
  userEmotion,
  updateEmotion,
  chronotype = 'Flexible',
  updateChronotype,
  culturalPassport,
  updatePassport
}: DashboardViewProps) {
  const [diaryNote, setDiaryNote] = useState('Watching the dawn boat rowers glide across Assi Ghat...');
  const [polaroidImage, setPolaroidImage] = useState(POLAROID_IMAGES[0].url);
  const [isMemoryGenerated, setIsMemoryGenerated] = useState(false);

  // Morning Hub states
  const [dreamText, setDreamText] = useState('');
  const [decodedVibe, setDecodedVibe] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [facialScanActive, setFacialScanActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanStepMessage, setScanStepMessage] = useState('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when component unmounts or scan inactive
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartFacialScan = async () => {
    setFacialScanActive(true);
    setScanProgress(0);
    setScanResult(null);
    setScanStepMessage('Requesting camera feed...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanStepMessage('Locking facial bounding boxes...');
    } catch (err) {
      console.warn("Camera permission denied, using holographic avatar fallback.");
      setScanStepMessage('Initializing holographic simulator...');
    }

    const playChime = (freq: number, dur: number) => {
      if (typeof window === 'undefined') return;
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        osc.start();
        osc.stop(ctx.currentTime + dur);
      } catch (e) {}
    };

    const steps = [
      'Scanning micro-expression layers...',
      'Mapping pupillary thermal variance...',
      'Analyzing amygdala arousal vectors...',
      'Matching emotional frequency...',
      'Scan complete!'
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setScanProgress(currentProgress);
      
      const stepIdx = Math.min(
        Math.floor((currentProgress / 100) * steps.length),
        steps.length - 1
      );
      setScanStepMessage(steps[stepIdx]);
      
      if (currentProgress % 15 === 0) {
        playChime(1200, 0.05);
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        const emotions = ['Happy', 'Stressed', 'Anxious', 'Tired', 'Excited', 'Sad', 'Neutral'];
        const chosen = emotions[Math.floor(Math.random() * emotions.length)];
        setScanResult(chosen);
        if (updateEmotion) {
          updateEmotion(chosen);
        }
        
        playChime(880, 0.4);
        setTimeout(() => playChime(1320, 0.6), 150);
      }
    }, 150);
  };

  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setDreamText(speechToText);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleDecodeDream = () => {
    if (!dreamText) return;
    const q = dreamText.toLowerCase();
    let match = 'Leh Ladakh';
    if (q.includes('beach') || q.includes('sea') || q.includes('water') || q.includes('sand') || q.includes('surf')) {
      match = 'Goa Beaches';
    } else if (q.includes('forest') || q.includes('jungle') || q.includes('tree') || q.includes('green') || q.includes('mist')) {
      match = 'Coorg Estates';
    } else if (q.includes('ruin') || q.includes('stone') || q.includes('temple') || q.includes('ancient') || q.includes('history')) {
      match = 'Hampi Ruins';
    } else if (q.includes('float') || q.includes('sky') || q.includes('salt') || q.includes('white')) {
      match = 'Rann of Kutch';
    } else if (q.includes('river') || q.includes('ghat') || q.includes('pray') || q.includes('chant')) {
      match = 'Varanasi Ghats';
    }
    setDecodedVibe(match);
  };

  const getCompanionMessage = () => {
    const emotion = userEmotion?.current || 'Neutral';
    const chrono = chronotype || 'Flexible';
    
    let line = "AI Companion Guide: Hope you are ready for a great day of discovery!";
    if (emotion === 'Stressed') {
      line = "⚠️ High Cortisol Detected: Priya Nair (Early Bird) recommends skipping high-intensity tours today. How about a peaceful walk around the Coorg Estates at 3:00 PM?";
    } else if (emotion === 'Tired') {
      line = "😴 Fatigue Warning: Aarav Sharma (Night Owl) suggests a spa session and beach hammock relaxation. No activities scheduled before 11:30 AM.";
    } else if (emotion === 'Excited') {
      line = "⚡ Energy Spike: Aarav Sharma wants to join you for scuba diving in Goa or renting ATVs in Ladakh!";
    } else if (emotion === 'Anxious') {
      line = "🛡️ Safety First: We have loaded nearby police stations and medical centers in your active route. Relax, you're covered.";
    } else if (emotion === 'Sad') {
      line = "🧡 Warm Connection: Aarav Sharma invites you to a local home-cooked thali dinner trail this evening.";
    } else if (chrono === 'Night Owl') {
      line = "🦉 Chronotype Alert: Aarav Sharma (Night Owl) has lined up Goa beach parties. Morning alarms set to 10:00 AM.";
    } else if (chrono === 'Early Bird') {
      line = "🌅 Chronotype Alert: Priya Nair (Early Bird) has added Ganga Aarti at 5:15 AM to your scheduled events.";
    }
    return line;
  };
  
  // Personalized traveler details
  const [displayName, setDisplayName] = useState('Traveler');
  const [savedDests, setSavedDests] = useState<Destination[]>([]);
  
  // Offline database records
  const [offlineItineraries, setOfflineItineraries] = useState<OfflineItinerary[]>([]);
  const [offlinePolaroids, setOfflinePolaroids] = useState<OfflinePolaroid[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // New gamification, planning CTA and date/quote state hooks
  const [lastSearchedDest, setLastSearchedDest] = useState<any>(null);
  const [activeDate, setActiveDate] = useState('');
  const [streak, setStreak] = useState(1);
  const [xp, setXp] = useState(8450);

  const travelQuotes = [
    "Not all those who wander are lost. — J.R.R. Tolkien",
    "Travel is the only thing you buy that makes you richer.",
    "Broad, wholesome views cannot be acquired by vegetating in one corner of the earth. — Mark Twain",
    "To travel is to live. — Hans Christian Andersen",
    "The journey not the arrival matters. — T.S. Eliot"
  ];
  const quote = travelQuotes[new Date().getDate() % travelQuotes.length];

  // Load records from IndexedDB and local storage
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

    setActiveDate(new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));

    // Setup streaks & XP validation
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = localStorage.getItem('gobro_last_login_date');
    const savedStreakStr = localStorage.getItem('gobro_login_streak');
    let savedStreak = savedStreakStr ? parseInt(savedStreakStr) : 1;
    const savedXpStr = localStorage.getItem('gobro_user_xp');
    let savedXp = savedXpStr ? parseInt(savedXpStr) : 8450;

    if (lastLogin) {
      if (lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastLogin === yesterdayStr) {
          savedStreak += 1;
          savedXp += 250;
        } else {
          savedStreak = 1;
        }
        localStorage.setItem('gobro_last_login_date', today);
        localStorage.setItem('gobro_login_streak', savedStreak.toString());
        localStorage.setItem('gobro_user_xp', savedXp.toString());
      }
    } else {
      localStorage.setItem('gobro_last_login_date', today);
      localStorage.setItem('gobro_login_streak', '1');
      localStorage.setItem('gobro_user_xp', '8450');
    }

    setStreak(savedStreak);
    setXp(savedXp);

    // Retrieve last searched destination cache
    const cachedDest = localStorage.getItem('gobro_last_selected_dest');
    if (cachedDest) {
      try {
        const parsed = JSON.parse(cachedDest);
        if (parsed && parsed.name) {
          setLastSearchedDest(parsed);
        }
      } catch (e) {
        console.error('Failed to parse active destination in dashboard:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
    } else {
      const uid = user?.uid || 'guest';
      const cachedName = localStorage.getItem(`gobro_${uid}_user_name`);
      if (cachedName) {
        setDisplayName(cachedName);
      } else {
        setDisplayName(user?.displayName || user?.email?.split('@')[0] || 'Traveler');
      }
    }

    const uid = user?.uid || 'guest';
    const cachedDests = localStorage.getItem(`gobro_${uid}_favorite_destinations`);
    if (cachedDests) {
      try {
        const ids: string[] = JSON.parse(cachedDests);
        const dests = ids.map(id => {
          const found = ALL_DESTS.find(d => d.id === id);
          if (found) return found;
          const onboardingPresets: Record<string, string> = {
            goa: 'Goa',
            munnar: 'Munnar',
            jaipur: 'Jaipur'
          };
          if (onboardingPresets[id]) {
            return constructDynamicDestination(onboardingPresets[id]);
          }
          return constructDynamicDestination(id);
        });
        setSavedDests(dests);
      } catch (err) {
        console.error("Failed to parse saved destinations:", err);
      }
    } else {
      // Default fallback destinations if none are selected
      setSavedDests([
        ALL_DESTS.find(d => d.id === 'varanasi')!,
        ALL_DESTS.find(d => d.id === 'leh')!,
        ALL_DESTS.find(d => d.id === 'hampi')!
      ].filter(Boolean));
    }
  }, [user, profile]);

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
        <div className="text-left">
          <span className="text-xs text-saffron-radiance font-semibold uppercase tracking-wider flex items-center gap-1">
            <Compass className="h-3.5 w-3.5" /> 
            {isOffline ? 'OFFLINE INDEXEDDB DASHBOARD CACHE' : 'Traveler Control Station'}
          </span>
          <div className="flex items-center gap-3 flex-wrap mt-1">
            <h1 className="text-3xl font-bold font-display text-white">
              Namaste, {displayName}!
            </h1>
            {userArchetype && ARCHETYPES[userArchetype] && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase text-white bg-gradient-to-r ${ARCHETYPES[userArchetype].bgGradient} border border-white/10 shadow-sm animate-pulse`}>
                {ARCHETYPES[userArchetype].badge}
              </span>
            )}
          </div>
          <span className="text-[10px] text-text-muted mt-1.5 block font-semibold font-mono">{activeDate}</span>
          <p className="text-xs italic text-text-muted mt-2 leading-relaxed max-w-xl font-medium border-l-2 border-velvet-rose/40 pl-3">
            “{quote}”
          </p>
        </div>

        <button 
          onClick={refreshLocalRecords} 
          className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-text-muted hover:text-white flex items-center gap-1 self-start md:self-end"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reload Local Cache
        </button>
      </div>

      {/* 🌅 Morning Check-in Hub */}
      <GlassCard glowColor="purple" className="p-6 text-left border border-purple-500/10">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌅</span>
            <div>
              <h2 className="text-base font-bold font-display text-white">Morning Check-in Hub</h2>
              <p className="text-xs text-text-muted mt-0.5">Prepare your mind, body, and companion sync settings for today's travels.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-semibold">Today's Mood:</span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/15 border border-purple-500/25 text-purple-400">
              {userEmotion?.current || 'Neutral'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1: Dream Journal & Decodes */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-saffron-radiance font-mono font-bold uppercase tracking-wider block mb-1">1. Dream Decryption Engine</span>
              <p className="text-xs text-text-muted leading-relaxed">Type what you dreamt about last night to sync sleep cycles with travel recommendations.</p>
            </div>
            <div className="relative">
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                placeholder="Describe your dream vibes (e.g. floating, golden sands, cold desert peak...)"
                className="w-full min-h-[90px] text-xs bg-black/45 border border-white/10 rounded-xl p-3 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
              <button
                onClick={startSpeechRecognition}
                className={`absolute right-3.5 bottom-3.5 p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-zinc-400 hover:text-white ${isListening ? 'animate-pulse text-velvet-rose border-velvet-rose/40' : ''}`}
                title="Voice Dictation"
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDecodeDream}
                disabled={!dreamText}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-zinc-500 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-950/20"
              >
                <Brain className="h-3.5 w-3.5" /> Decode Vibe Match
              </button>
            </div>

            {decodedVibe && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs flex items-start gap-2 text-emerald-400"
              >
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Vibe Match Unlocked!</p>
                  <p className="text-[10px] text-emerald-300/80 mt-0.5">Your dream vibe aligns perfectly with <strong className="text-white">{decodedVibe}</strong>. Go to Discover to find packages!</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Col 2: Daily Scanner & Face Scan */}
          <div className="space-y-4 relative flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-saffron-radiance font-mono font-bold uppercase tracking-wider block mb-1">2. Biometric Facial Scan</span>
              <p className="text-xs text-text-muted leading-relaxed">Take a 3-second diagnostic webcam check to track daily travel fatigue levels.</p>
            </div>

            <div className="relative aspect-video w-full bg-black/60 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center">
              {facialScanActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                  {/* Neon scan box lines and scanner grids */}
                  <div className="absolute inset-4 border border-dashed border-purple-500/40 rounded-lg pointer-events-none animate-pulse">
                    <div className="absolute inset-x-0 top-1/2 h-[1px] bg-purple-500 animate-bounce shadow-[0_0_8px_#8b5cf6]" />
                    <div className="absolute top-2 left-2 text-[8px] font-mono text-purple-400 uppercase tracking-widest bg-black/60 px-1 py-0.5 rounded">
                      FACIAL_HUD_V2
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-black/80 px-3 py-2 border-t border-white/5">
                    <div className="flex justify-between text-[9px] font-mono text-purple-300 mb-1">
                      <span>{scanStepMessage}</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full transition-all duration-150" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                </>
              ) : scanResult ? (
                <div className="p-4 text-center space-y-2">
                  <span className="text-3xl">🛡️</span>
                  <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">Mood Locked In</p>
                  <p className="text-xl font-bold text-purple-400 font-display">{scanResult}</p>
                  <button
                    onClick={handleStartFacialScan}
                    className="mt-2 text-[10px] text-text-muted hover:text-white underline font-semibold font-mono"
                  >
                    Rescan Biometrics
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 flex flex-col items-center">
                  <Camera className="h-8 w-8 text-zinc-500 mb-2" />
                  <button
                    onClick={handleStartFacialScan}
                    className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    ⚡ Start 3s Diagnostic Scan
                  </button>
                  <span className="text-[9px] text-text-muted mt-2 block">Silently runs facial scan logs locally on device</span>
                </div>
              )}
            </div>
          </div>

          {/* Col 3: Chronotypes & Companion Guides */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-saffron-radiance font-mono font-bold uppercase tracking-wider block mb-1">3. Companion Sync & Chronotype</span>
                <p className="text-xs text-text-muted leading-relaxed">Align stop timings with your natural circadian sleeping rhythm.</p>
              </div>

              {/* Chronotype Selector */}
              <div className="flex gap-2">
                {(['Early Bird', 'Night Owl', 'Flexible'] as const).map(item => {
                  const isActive = chronotype === item;
                  return (
                    <button
                      key={item}
                      onClick={() => updateChronotype && updateChronotype(item)}
                      className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono font-bold tracking-wide uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${isActive ? 'bg-gradient-to-r from-velvet-rose/15 to-saffron-radiance/15 border-saffron-radiance text-saffron-radiance font-bold' : 'bg-black/30 border-white/5 text-zinc-500 hover:text-white'}`}
                    >
                      {item === 'Early Bird' ? <Sunrise className="h-3.5 w-3.5" /> : item === 'Night Owl' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Companion Feed Alert */}
            <div className="bg-white/2 border border-white/5 p-3 rounded-2xl space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-saffron-radiance/20 flex items-center justify-center text-[10px]">
                  👤
                </div>
                <span className="text-[10px] font-bold text-white">AI Copilot Dispatch</span>
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed font-mono">
                {getCompanionMessage()}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Continue Planning CTA Card */}
      {lastSearchedDest && (
        <GlassCard glowColor="rose" className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-velvet-rose/20 text-left">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-velvet-rose/10 border border-velvet-rose/25 flex items-center justify-center text-xl select-none">
              ✈️
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Continue Planning Your Getaway</h3>
              <p className="text-xs text-text-muted mt-0.5">
                You were looking at <strong className="text-white">{lastSearchedDest.name}</strong>. Create a tailored itinerary now!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedDest(lastSearchedDest);
              setActiveView('planner');
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white text-xs font-bold shadow-md hover:scale-102 transition-all flex items-center gap-1.5 shrink-0"
          >
            Design Itinerary &rarr;
          </button>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Registered Journeys & Local DB Records */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: Trip Journey Timeline */}
          <div className="space-y-4 text-left">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Compass className="h-5 w-5 text-saffron-radiance" />
              Trip Journey Timeline
            </h2>
            <GlassCard hoverEffect={false} className="p-6 relative overflow-x-auto">
              <div className="flex items-center min-w-[500px] justify-between relative py-2">
                {/* Horizontal Line connector */}
                <div className="absolute left-8 right-8 top-[30px] h-0.5 bg-white/10 z-0" />
                
                {/* 1. Completed */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 font-bold shadow-md select-none">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-white mt-2">Varanasi Trip</span>
                  <span className="text-[9px] text-emerald-400 font-semibold font-mono mt-0.5">Completed</span>
                </div>

                {/* 2. Scheduled */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="h-10 w-10 rounded-full bg-saffron-radiance/20 border-2 border-saffron-radiance flex items-center justify-center text-saffron-radiance font-bold shadow-md animate-pulse select-none">
                    📅
                  </div>
                  <span className="text-xs font-bold text-white mt-2">Goa Beach Cruise</span>
                  <span className="text-[9px] text-saffron-radiance font-semibold font-mono mt-0.5">Upcoming</span>
                </div>

                {/* 3. Saved / Wishlist */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="h-10 w-10 rounded-full bg-velvet-rose/20 border-2 border-velvet-rose flex items-center justify-center text-velvet-rose font-bold shadow-md select-none">
                    💖
                  </div>
                  <span className="text-xs font-bold text-white mt-2">{lastSearchedDest?.name || 'Munnar Mist'}</span>
                  <span className="text-[9px] text-velvet-rose font-semibold font-mono mt-0.5">Wishlist Saved</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Section: My Saved Destinations */}
          {savedDests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 text-left">
                <Bookmark className="h-5 w-5 text-saffron-radiance" />
                My Saved Destinations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {savedDests.map((dest) => (
                  <GlassCard
                    key={dest.id}
                    onClick={() => {
                      setSelectedDest(dest);
                      setActiveView('itinerary');
                    }}
                    className="p-0 overflow-hidden border border-white/10 bg-white/2 cursor-pointer group hover:scale-102 transition-transform aspect-video sm:aspect-square flex flex-col justify-end min-h-[140px] relative"
                  >
                    <div className="absolute inset-0 z-0">
                      <img src={dest.imageUrl} alt={dest.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    </div>
                    
                    <div className="relative z-10 p-3 text-left">
                      <span className="text-[8px] text-saffron-radiance font-mono uppercase tracking-wider block font-bold">
                        {dest.state || 'India'}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5 flex items-center justify-between">
                        {dest.name}
                        <ArrowRight className="h-3.5 w-3.5 text-white/55 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </h4>
                      <p className="text-[9px] text-text-muted mt-1 line-clamp-2 leading-relaxed">
                        {dest.description}
                      </p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
          
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
          
          {/* XP & Streak Gamification Card */}
          <GlassCard hoverEffect={false} className="p-5 text-left space-y-4">
            <span className="text-[10px] text-saffron-radiance font-mono uppercase tracking-widest flex items-center gap-1.5 select-none">
              🔥 Gamified Travel Streaks
            </span>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-1 select-none">
                  🔥 {streak} Day Streak!
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5 font-medium">Daily login streak keeps active</p>
              </div>
              <span className="bg-saffron-radiance/10 border border-saffron-radiance/30 text-saffron-radiance px-3 py-1 rounded-full text-xs font-bold font-mono select-none">
                Level {Math.floor((xp - 8000) / 100) + 40}
              </span>
            </div>

            {/* XP progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-semibold text-text-muted">
                <span>XP Progress</span>
                <span className="text-white font-mono">{xp} / {Math.ceil((xp + 1) / 1000) * 1000} XP</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-velvet-rose to-saffron-radiance rounded-full transition-all duration-500"
                  style={{ width: `${(xp % 1000) / 10}%` }}
                />
              </div>
            </div>

            <div className="text-[9px] text-text-muted leading-relaxed font-medium bg-white/2 p-2.5 rounded-xl border border-white/5">
              🚀 Gained +250 XP for daily check-in! Create itineraries and postcards to earn more.
            </div>
          </GlassCard>

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
