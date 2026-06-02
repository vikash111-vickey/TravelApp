'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import FloatingChat from '../components/FloatingChat';
import HomeView from '../views/HomeView';
import QuizView from '../views/QuizView';
import DiscoverView from '../views/DiscoverView';
import PredictView from '../views/PredictView';
import PlannerView from '../views/PlannerView';
import BookingView from '../views/BookingView';
import DashboardView from '../views/DashboardView';
import ProfileView from '../views/ProfileView';
import LoginView from '../views/LoginView';
import LiveNatureBackground from '../components/LiveNatureBackground';
import OnboardingView from '../views/OnboardingView';
import SOSModal from '../components/SOSModal';
import { DESTINATIONS, Destination } from '../data/mockData';
import { initFirebaseClient, mockAuth, mockDb } from '../utils/firebase';
import { calculateDistanceKm } from '../utils/geosearch';

interface CartItem {
  id: string;
  type: string;
  title: string;
  price: number;
  provider: string;
  details: string;
}

interface Trip {
  id: string;
  name: string;
  date: string;
  status: string;
  itemsCount: number;
}

export default function Page() {
  const [activeView, setActiveView] = useState<string>('home');
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null); // Purely dynamic coordinate search
  const [userArchetype, setUserArchetype] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [lang, setLang] = useState<string>('EN');
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ displayName: string; email: string; photoURL: string } | null>(null);
  const [authObj, setAuthObj] = useState<any>(null);
  const [dbObj, setDbObj] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [authTimeout, setAuthTimeout] = useState<boolean>(false);
  const [showOfflineDetails, setShowOfflineDetails] = useState<boolean>(false);

  // Global Toast and Theme states
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [theme, setTheme] = useState<string>('dark');

  // WanderLens Ultimate Expansion states
  const [userEmotion, setUserEmotion] = useState<{ current: string; history: Array<{ date: string; emotion: string }> }>({
    current: 'Neutral',
    history: [
      { date: '2026-05-25', emotion: 'Excited' },
      { date: '2026-05-27', emotion: 'Stressed' },
      { date: '2026-05-29', emotion: 'Happy' },
      { date: '2026-05-31', emotion: 'Neutral' },
      { date: '2026-06-02', emotion: 'Neutral' }
    ]
  });

  const [ecoKarma, setEcoKarma] = useState<number>(300);

  const [culturalPassport, setCulturalPassport] = useState<{
    stamps: string[];
    challenges: Record<string, boolean>;
    dnaProfile: { spiritual: number; heritage: number; nature: number };
  }>({
    stamps: ['varanasi'],
    challenges: {
      'attend-aarti': false,
      'try-street-food': false,
      'speak-3-words': false
    },
    dnaProfile: { spiritual: 40, heritage: 35, nature: 25 }
  });

  const [ancestryMix, setAncestryMix] = useState<Record<string, number>>({
    'South Indian Dravidian': 35,
    'Rajput/North Indian': 25,
    'Goan/Konkan': 20,
    'Himalayan': 20
  });

  const [chronotype, setChronotype] = useState<string>('Flexible');
  const [synesthesiaColor, setSynesthesiaColor] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    
    const savedEmotion = localStorage.getItem(`gobro_${uid}_user_emotion`);
    if (savedEmotion) {
      try { setUserEmotion(JSON.parse(savedEmotion)); } catch (e) {}
    }
    const savedKarma = localStorage.getItem(`gobro_${uid}_eco_karma`);
    if (savedKarma) {
      setEcoKarma(Number(savedKarma));
    }
    const savedPassport = localStorage.getItem(`gobro_${uid}_cultural_passport`);
    if (savedPassport) {
      try { setCulturalPassport(JSON.parse(savedPassport)); } catch (e) {}
    }
    const savedAncestry = localStorage.getItem(`gobro_${uid}_ancestry_mix`);
    if (savedAncestry) {
      try { setAncestryMix(JSON.parse(savedAncestry)); } catch (e) {}
    }
    const savedChronotype = localStorage.getItem(`gobro_${uid}_chronotype`);
    if (savedChronotype) {
      setChronotype(savedChronotype);
    }
  }, [user]);

  const updateEmotion = (newEmotion: string) => {
    if (!user) return;
    const uid = user.uid;
    const today = new Date().toISOString().split('T')[0];
    setUserEmotion(prev => {
      const isTodayLogged = prev.history.some(h => h.date === today);
      let newHistory = [...prev.history];
      if (isTodayLogged) {
        newHistory = newHistory.map(h => h.date === today ? { date: today, emotion: newEmotion } : h);
      } else {
        newHistory.push({ date: today, emotion: newEmotion });
      }
      const val = { current: newEmotion, history: newHistory };
      localStorage.setItem(`gobro_${uid}_user_emotion`, JSON.stringify(val));
      return val;
    });
  };

  const updateKarma = (points: number) => {
    if (!user) return;
    const uid = user.uid;
    setEcoKarma(prev => {
      const newScore = Math.max(0, prev + points);
      localStorage.setItem(`gobro_${uid}_eco_karma`, String(newScore));
      return newScore;
    });
  };

  const updatePassport = (updater: (prev: typeof culturalPassport) => typeof culturalPassport) => {
    if (!user) return;
    const uid = user.uid;
    setCulturalPassport(prev => {
      const val = updater(prev);
      localStorage.setItem(`gobro_${uid}_cultural_passport`, JSON.stringify(val));
      return val;
    });
  };

  const updateAncestry = (newAncestry: typeof ancestryMix) => {
    if (!user) return;
    const uid = user.uid;
    setAncestryMix(newAncestry);
    localStorage.setItem(`gobro_${uid}_ancestry_mix`, JSON.stringify(newAncestry));
  };

  const updateChronotype = (newChronotype: string) => {
    if (!user) return;
    const uid = user.uid;
    setChronotype(newChronotype);
    localStorage.setItem(`gobro_${uid}_chronotype`, newChronotype);
  };

  // Real Location Engine State
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city: string;
    accuracy: number;
    status: 'enabled' | 'denied' | 'prompt' | 'fetching';
  } | null>(null);

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
        headers: { 'User-Agent': 'WanderLensTravelCopilot/1.0 (vikas@gobro.ai)' }
      });
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.suburb || address.county || 'My Location';
        return city;
      }
    } catch (e) {
      console.warn("Reverse geocoding failed:", e);
    }
    return 'My Location';
  };

  const handleLocationWatch = (): number | null => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setUserLocation({
        lat: 28.6139,
        lng: 77.2090,
        city: 'Delhi',
        accuracy: 1000,
        status: 'denied'
      });
      return null;
    }

    setUserLocation(prev => ({ 
      lat: prev?.lat || 28.6139, 
      lng: prev?.lng || 77.2090, 
      city: prev?.city || 'Locating...', 
      accuracy: prev?.accuracy || 1000, 
      status: 'fetching' 
    }));

    const success = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const city = await reverseGeocode(latitude, longitude);
      const loc = {
        lat: latitude,
        lng: longitude,
        city,
        accuracy,
        status: 'enabled' as const
      };
      setUserLocation(loc);
      localStorage.setItem('gobro_detected_location', JSON.stringify(loc));
    };

    const error = (err: GeolocationPositionError) => {
      console.warn("Geolocation watch failed:", err);
      setUserLocation({
        lat: 28.6139,
        lng: 77.2090,
        city: 'Location Off',
        accuracy: 1000,
        status: 'denied' as const
      });
    };

    const watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    return watchId;
  };

  // Watch position & permissions check on mount
  useEffect(() => {
    let watchId: number | null = null;
    
    // Load from cache first
    const cached = localStorage.getItem('gobro_detected_location');
    if (cached) {
      try {
        setUserLocation(JSON.parse(cached));
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && navigator.geolocation) {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((status) => {
          if (status.state === 'granted' || status.state === 'prompt') {
            watchId = handleLocationWatch();
          } else {
            setUserLocation({
              lat: 28.6139,
              lng: 77.2090,
              city: 'Location Off',
              accuracy: 1000,
              status: 'denied'
            });
          }
        }).catch(() => {
          watchId = handleLocationWatch();
        });
      } else {
        watchId = handleLocationWatch();
      }
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Geofencing trigger hook
  useEffect(() => {
    if (!userLocation || userLocation.status !== 'enabled') return;
    
    const uid = user?.uid || 'guest';
    const cachedDests = localStorage.getItem(`gobro_${uid}_favorite_destinations`);
    if (!cachedDests) return;
    
    try {
      const ids: string[] = JSON.parse(cachedDests);
      ids.forEach(id => {
        const dest = DESTINATIONS.find(d => d.id === id);
        if (dest && dest.coordinates) {
          const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, dest.coordinates.lat, dest.coordinates.lng);
          if (dist <= 0.5) { // 500 meters
            const lastAlert = localStorage.getItem(`gobro_geofence_alert_${id}`);
            const now = Date.now();
            if (!lastAlert || now - parseInt(lastAlert) > 10 * 60 * 1000) { // 10 min cooldown
              showToast(`📍 You're near ${dest.name}! Tap to start your guided tour.`, 'info');
              localStorage.setItem(`gobro_geofence_alert_${id}`, now.toString());
              if (typeof window !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
              }
            }
          }
        }
      });
    } catch (e) {
      console.warn("Geofencing check failed:", e);
    }
  }, [userLocation, user]);

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('gobro_theme', newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
      showToast("🔆 Light Mode Active", "info");
    } else {
      document.body.classList.remove('light-theme');
      showToast("🌙 Dark Mode Active", "info");
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load saved theme preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('gobro_theme') || 'dark';
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    }
  }, []);

  const syncUserProfile = async (currentUser: any, db: any) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    
    const uid = currentUser.uid;
    const email = currentUser.email || '';
    const emailPrefix = email ? email.split('@')[0] : 'explorer';
    
    let displayName = currentUser.displayName || '';
    let photoURL = currentUser.photoURL || '';
    
    // Always check firestore profile to prevent placeholders
    if (db && !currentUser.isGuest) {
      try {
        const snap = await db.collection('users').doc(uid).get();
        if (snap.exists) {
          const data = snap.data();
          if (data) {
            if (data.name) displayName = data.name;
            if (data.photoURL) photoURL = data.photoURL;
          }
        }
      } catch (err: any) {
        if (err?.message?.includes('offline') || err?.code === 'unavailable') {
          console.log("Firestore offline, profile sync skipped (will resume when online).");
        } else {
          console.warn("Error fetching profile from Firestore during sync:", err);
        }
      }
    }
    
    if (!displayName) {
      displayName = localStorage.getItem(`gobro_${uid}_user_name`) || '';
    }
    if (!photoURL) {
      photoURL = localStorage.getItem(`gobro_${uid}_user_photo`) || '';
    }
    
    if (!displayName) {
      displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    if (!photoURL) {
      photoURL = `https://api.dicebear.com/7.x/adventurer/svg?seed=${emailPrefix}`;
    }
    
    setProfile({ displayName, email, photoURL });
    localStorage.setItem(`gobro_${uid}_user_name`, displayName);
    localStorage.setItem(`gobro_${uid}_user_photo`, photoURL);
  };


  // Sync auth session state
  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    const timeoutId = setTimeout(() => {
      if (isMounted && authChecking) {
        setAuthTimeout(true);
      }
    }, 5000);

    const setupAuthListener = async () => {
      let activeAuth = mockAuth;
      let activeDb = mockDb;

      try {
        const { auth, db } = await initFirebaseClient();
        activeAuth = auth;
        activeDb = db;
        setAuthObj(auth);
        setDbObj(db);
      } catch (err) {
        console.warn("Using local database fallbacks (offline configuration).");
        setAuthObj(mockAuth);
        setDbObj(mockDb);
      }

      unsubscribe = activeAuth.onAuthStateChanged((currentUser: any) => {
        if (currentUser) {
          setUser(currentUser);
          syncUserProfile(currentUser, activeDb);

          // Sync trips from local storage or initialize
          const cachedTrips = localStorage.getItem(`gobro_${currentUser.uid}_upcoming_trips`);
          if (cachedTrips) {
            try {
              setUpcomingTrips(JSON.parse(cachedTrips));
            } catch (e) {
              console.error(e);
            }
          } else {
            const defaultTrips = [
              {
                id: 'past-trip-1',
                name: 'South Goa Escape',
                date: '2026-03-14',
                status: 'Completed',
                itemsCount: 3
              }
            ];
            setUpcomingTrips(defaultTrips);
            localStorage.setItem(`gobro_${currentUser.uid}_upcoming_trips`, JSON.stringify(defaultTrips));
          }
          
          // Sync profiles to local storage using user-scoped keys
          if (activeDb) {
            activeDb.collection('users').doc(currentUser.uid).get().then((snap: any) => {
              if (snap.exists) {
                const cloud = snap.data();
                if (cloud) {
                  const uid = currentUser.uid;
                  
                  // Google Sign-In Profile Auto-Fill logic for existing Firestore doc
                  let needsUpdate = false;
                  const updateData: any = {};
                  if (!cloud.name && currentUser.displayName) {
                    updateData.name = currentUser.displayName;
                    needsUpdate = true;
                  }
                  if (!cloud.photoURL && currentUser.photoURL) {
                    updateData.photoURL = currentUser.photoURL;
                    needsUpdate = true;
                  }

                  if (needsUpdate) {
                    activeDb.collection('users').doc(uid).set(updateData, { merge: true }).then(() => {
                      syncUserProfile(currentUser, activeDb);
                    }).catch(console.error);
                  }

                  if (cloud.name) localStorage.setItem(`gobro_${uid}_user_name`, cloud.name);
                  if (cloud.passport) localStorage.setItem(`gobro_${uid}_user_passport`, cloud.passport);
                  if (cloud.homeCity) localStorage.setItem(`gobro_${uid}_user_home`, cloud.homeCity);
                  if (cloud.contact) localStorage.setItem(`gobro_${uid}_user_contact`, cloud.contact);
                  if (cloud.blood) localStorage.setItem(`gobro_${uid}_user_blood`, cloud.blood);
                  
                  if (cloud.family1Name) localStorage.setItem(`gobro_${uid}_fam1_name`, cloud.family1Name);
                  if (cloud.family1Relation) localStorage.setItem(`gobro_${uid}_fam1_rel`, cloud.family1Relation);
                  if (cloud.family1Phone) localStorage.setItem(`gobro_${uid}_fam1_phone`, cloud.family1Phone);
                  
                  if (cloud.family2Name) localStorage.setItem(`gobro_${uid}_fam2_name`, cloud.family2Name);
                  if (cloud.family2Relation) localStorage.setItem(`gobro_${uid}_fam2_rel`, cloud.family2Relation);
                  if (cloud.family2Phone) localStorage.setItem(`gobro_${uid}_fam2_phone`, cloud.family2Phone);
                  
                  if (cloud.friend1Name) localStorage.setItem(`gobro_${uid}_fr1_name`, cloud.friend1Name);
                  if (cloud.friend1Phone) localStorage.setItem(`gobro_${uid}_fr1_phone`, cloud.friend1Phone);
                  if (cloud.friend2Name) localStorage.setItem(`gobro_${uid}_fr2_name`, cloud.friend2Name);
                  if (cloud.friend2Phone) localStorage.setItem(`gobro_${uid}_fr2_phone`, cloud.friend2Phone);

                  if (cloud.persona) {
                    setUserArchetype(cloud.persona);
                    localStorage.setItem(`gobro_${uid}_user_persona`, cloud.persona);
                  }
                  if (cloud.favoriteDestinations) {
                    localStorage.setItem(`gobro_${uid}_favorite_destinations`, JSON.stringify(cloud.favoriteDestinations));
                  }

                  if (!cloud.onboardingCompleted && !currentUser.isGuest) {
                    if (isMounted) setShowOnboarding(true);
                  } else {
                    if (isMounted) setShowOnboarding(false);
                  }
                }
              } else {
                // Google Sign-In autofill for Firestore profile (New User)
                if (currentUser.displayName || currentUser.photoURL) {
                  activeDb.collection('users').doc(currentUser.uid).set({
                    name: currentUser.displayName || currentUser.email.split('@')[0],
                    photoURL: currentUser.photoURL || '',
                    onboardingCompleted: true,
                    createdAt: new Date().toISOString()
                  }, { merge: true }).then(() => {
                    if (isMounted) setShowOnboarding(false);
                    syncUserProfile(currentUser, activeDb);
                  }).catch(console.error);
                } else if (!currentUser.isGuest) {
                  // New email signup, trigger onboarding
                  if (isMounted) setShowOnboarding(true);
                }
              }
            }).catch((e: any) => console.log("Failed to sync cloud profile data:", e));
          }
        } else {
          setUser(null);
          setProfile(null);
          if (isMounted) setShowOnboarding(false);
        }
        if (isMounted) {
          setAuthChecking(false);
          clearTimeout(timeoutId);
        }
      });
    };

    setupAuthListener();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const activeAuth = authObj || mockAuth;
    try {
      await activeAuth.signOut();
      localStorage.removeItem('gobro_guest_user');
      setUser(null);
      setActiveView('home');
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  // Register PWA Service Worker on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('GOBRO Service Worker registered on scope:', reg.scope))
        .catch((err) => console.error('GOBRO Service Worker registration failed:', err));
    }

    // Attempt to load lang from localStorage
    const savedLang = localStorage.getItem('gobro_lang');
    if (savedLang) setLang(savedLang);
  }, []);

  const handleSetLang = (newLang: string) => {
    setLang(newLang);
    localStorage.setItem('gobro_lang', newLang);
  };

  // Cart operations
  const addToCart = (item: CartItem) => {
    setCartItems((prev) => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Dashboard upcoming trip operations
  const addUpcomingTrip = (trip: Trip) => {
    setUpcomingTrips((prev) => {
      const updated = [trip, ...prev];
      if (user) {
        localStorage.setItem(`gobro_${user.uid}_upcoming_trips`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Route View Switcher
  const renderActiveView = () => {
    switch (activeView) {
      case 'home':
        return (
          <HomeView 
            setActiveView={setActiveView} 
            setSelectedDest={setSelectedDest} 
            isOffline={isOffline}
            setIsOffline={setIsOffline}
            lang={lang}
          />
        );
      case 'quiz':
        return (
          <QuizView 
            setActiveView={setActiveView} 
            setUserArchetype={setUserArchetype} 
            user={user}
            dbObj={dbObj}
            onProfileSync={() => syncUserProfile(user, dbObj)}
          />
        );
      case 'discover':
        return (
          <DiscoverView 
            setActiveView={setActiveView} 
            userArchetype={userArchetype} 
            setSelectedDest={setSelectedDest}
            selectedDest={selectedDest}
            isOffline={isOffline}
            cartItems={cartItems}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            onTriggerSOS={() => setIsSOSOpen(true)}
            showToast={showToast}
            user={user}
            dbObj={dbObj}
            userLocation={userLocation}
            triggerLocationRequest={handleLocationWatch}
            synesthesiaColor={synesthesiaColor}
            setSynesthesiaColor={setSynesthesiaColor}
            updateKarma={updateKarma}
          />
        );
      case 'predict':
        return (
          <PredictView 
            selectedDest={selectedDest} 
            setSelectedDest={setSelectedDest} 
            userLocation={userLocation}
          />
        );
      case 'itinerary':
        return (
          <PlannerView 
            setActiveView={setActiveView} 
            selectedDest={selectedDest} 
            setSelectedDest={setSelectedDest}
            addToCart={addToCart}
            isOffline={isOffline}
            lang={lang}
            cartItems={cartItems}
            removeFromCart={removeFromCart}
            user={user}
            dbObj={dbObj}
            userLocation={userLocation}
            triggerLocationRequest={handleLocationWatch}
            userEmotion={userEmotion}
            updateEmotion={updateEmotion}
            chronotype={chronotype}
            updateKarma={updateKarma}
          />
        );
      case 'booking':
        return (
          <BookingView 
            setActiveView={setActiveView} 
            cartItems={cartItems} 
            removeFromCart={removeFromCart} 
            clearCart={clearCart} 
            selectedDest={selectedDest}
            addUpcomingTrip={addUpcomingTrip}
            isOffline={isOffline}
          />
        );
      case 'dashboard':
        return (
          <DashboardView 
            setActiveView={setActiveView} 
            upcomingTrips={upcomingTrips} 
            selectedDest={selectedDest}
            setSelectedDest={setSelectedDest}
            isOffline={isOffline}
            user={user}
            userArchetype={userArchetype}
            profile={profile}
            userEmotion={userEmotion}
            updateEmotion={updateEmotion}
            chronotype={chronotype}
            updateChronotype={updateChronotype}
            culturalPassport={culturalPassport}
            updatePassport={updatePassport}
          />
        );
      case 'profile':
        return (
          <ProfileView
            lang={lang}
            setLang={handleSetLang}
            userArchetype={userArchetype}
            isOffline={isOffline}
            showToast={showToast}
            setIsOffline={setIsOffline}
            user={user}
            dbObj={dbObj}
            onLogout={handleLogout}
            upcomingTrips={upcomingTrips}
            setActiveView={setActiveView}
            profile={profile}
            onProfileSync={() => syncUserProfile(user, dbObj)}
            userEmotion={userEmotion}
            updateEmotion={updateEmotion}
            ecoKarma={ecoKarma}
            updateKarma={updateKarma}
            culturalPassport={culturalPassport}
            updatePassport={updatePassport}
            ancestryMix={ancestryMix}
            updateAncestry={updateAncestry}
            chronotype={chronotype}
            updateChronotype={updateChronotype}
          />
        );
      default:
        return (
          <HomeView 
            setActiveView={setActiveView} 
            setSelectedDest={setSelectedDest} 
            isOffline={isOffline}
            setIsOffline={setIsOffline}
            lang={lang}
          />
        );
    }
  };

  const viewVariants = {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 }
  };

  const getToastStyle = (type: string) => {
    switch (type) {
      case 'success': return 'border-emerald-500/20 text-emerald-400 bg-emerald-950/90 shadow-emerald-500/10';
      case 'error': return 'border-red-500/20 text-red-400 bg-red-950/90 shadow-red-500/10';
      case 'warning': return 'border-amber-500/20 text-amber-400 bg-amber-950/90 shadow-amber-500/10';
      case 'info': return 'border-blue-500/20 text-blue-400 bg-blue-950/90 shadow-blue-500/10';
      default: return 'border-white/10 text-white bg-black/90';
    }
  };

  return (
    <div 
      className="relative min-h-screen flex flex-col bg-midnight-obsidian text-text-body overflow-x-hidden bg-accent-glow pb-20 md:pb-0"
      style={{
        background: synesthesiaColor 
          ? `radial-gradient(circle at top right, ${synesthesiaColor}15, #08080a 70%)` 
          : undefined
      }}
    >
      
      {/* Live Nature Backdrops */}
      <LiveNatureBackground />
      
      {/* Sticky Header */}
      <Navbar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        cartCount={cartItems.length} 
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        onTriggerSOS={() => setIsSOSOpen(true)}
        profile={profile}
        theme={theme}
        toggleTheme={toggleTheme}
        userLocation={userLocation}
        triggerLocationRequest={handleLocationWatch}
      />

      {/* Offline Mode Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-amber-500/10 border-b border-amber-500/20 py-2.5 relative z-40 backdrop-blur-md select-none text-center cursor-pointer hover:bg-amber-500/15 transition-colors"
            onClick={() => setShowOfflineDetails(!showOfflineDetails)}
          >
            <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
              <div className="flex items-center justify-center gap-2">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
                <span className="text-[11px] text-amber-400 font-semibold tracking-wider">
                  WanderLens Offline Mode Active — Local ML Models & IndexedDB Enabled.
                </span>
              </div>
              <span className="text-[10px] text-amber-500 hover:text-amber-300 font-bold underline transition-colors">
                {showOfflineDetails ? 'Hide Status Breakdown ▲' : 'Show Feature Breakdown ▼'}
              </span>
            </div>
            {showOfflineDetails && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="max-w-2xl mx-auto mt-3 px-6 py-3 rounded-2xl bg-black/80 border border-amber-500/20 text-[10px] text-left text-text-muted space-y-2 leading-relaxed"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <span className="text-emerald-400 font-bold block mb-1">🟢 AVAILABLE OFFLINE:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-zinc-300">
                      <li><strong>Explore & Discover</strong>: Browse local sight databases using cached memory weights.</li>
                      <li><strong>AI Itinerary Planner</strong>: Formulate custom routes using client-side tensor grids.</li>
                      <li><strong>Saved Plans & Diary</strong>: Compile travel plans and polaroids (IndexedDB cached).</li>
                      <li><strong>Emergency SOS Alert</strong>: Broadcast distress warnings via mock local device mesh channels.</li>
                    </ul>
                  </div>
                  <div className="flex-1 space-y-1 md:border-l border-white/10 md:pl-4">
                    <span className="text-amber-500 font-bold block mb-1">🟠 REQUIRES CONNECTION:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-zinc-300">
                      <li><strong>Sandbox Checkouts</strong>: Booking payments and ticket ledger verification.</li>
                      <li><strong>Cloud Profile Sync</strong>: Back up emergency nodes and traveler settings to server gateways.</li>
                      <li><strong>Itinerary Sharing Links</strong>: Save plan payloads to public cloud web addresses.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Viewport */}
      <main className="flex-1 w-full relative z-10 flex flex-col items-center justify-center">
        {authChecking ? (
          authTimeout ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-6">
              <div className="h-12 w-12 rounded-full bg-red-950/45 border border-red-500/30 flex items-center justify-center text-red-500 mb-2">
                ⚠️
              </div>
              <h3 className="text-base font-bold text-white font-display">Authentication Timeout</h3>
              <p className="text-xs text-text-muted max-w-xs leading-relaxed">
                We couldn't connect to the WanderLens Cloud Gateways. Check your connection or enter offline database fallback mode.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setAuthTimeout(false);
                    setAuthChecking(true);
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
                >
                  Retry Connection
                </button>
                <button
                  onClick={() => {
                    setAuthChecking(false);
                    setUser({
                      uid: 'offline-explorer-' + Math.floor(Math.random() * 10000),
                      email: 'offline.traveler@wanderlens.ai',
                      isGuest: true
                    });
                    setIsOffline(true);
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/10 active:scale-95 transition-all animate-pulse"
                >
                  Force Offline Mode
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <Loader2 className="h-10 w-10 text-velvet-rose animate-spin" />
              <p className="text-xs text-text-muted font-mono tracking-widest uppercase animate-pulse">
                Authenticating Traveler Gateway...
              </p>
            </div>
          )
        ) : !user ? (
          <LoginView onLoginSuccess={(u, a, d) => {
            setUser(u);
            setAuthObj(a);
            setDbObj(d);
            syncUserProfile(u, d);
            showToast("✅ Login successful");
          }} />
        ) : showOnboarding ? (
          <OnboardingView 
            user={user} 
            dbObj={dbObj} 
            onComplete={() => {
              setShowOnboarding(false);
              syncUserProfile(user, dbObj);
            }} 
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full flex-1 flex flex-col items-center"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Floating Companion Chat */}
      <FloatingChat isOffline={isOffline} lang={lang} />

      {/* Global Mobile FAB SOS Button (Collapsed for screens < 768px) */}
      <div className="md:hidden fixed bottom-20 left-6 z-45">
        <button
          onClick={() => setIsSOSOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-tr from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white shadow-2xl flex flex-col items-center justify-center font-bold text-[9px] border border-white/20 animate-pulse cursor-pointer shadow-red-500/20"
          title="Emergency SOS Dispatch Alert"
        >
          <span className="text-base mb-0.5">🚨</span>
          <span>SOS</span>
        </button>
      </div>

      {/* Global SOS Drawer Modal */}
      <SOSModal 
        isOpen={isSOSOpen} 
        onClose={() => setIsSOSOpen(false)} 
        selectedDestName={selectedDest ? selectedDest.name : null}
        user={user}
        showToast={showToast}
        userLocation={userLocation}
        triggerLocationRequest={handleLocationWatch}
      />

      {/* Global Toast Container */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-xs font-bold border flex items-center gap-2 shadow-2xl backdrop-blur-xl ${getToastStyle(toast.type)}`}
          >
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full py-6 bg-black/40 border-t border-white/5 text-center text-xs text-text-muted mt-12 relative z-10">
        <p>&copy; {new Date().getFullYear()} WanderLens AI Travel Platform. Built offline-first using client-side model weights.</p>
      </footer>

    </div>
  );
}

