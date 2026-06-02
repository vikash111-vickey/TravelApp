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
import SOSModal from '../components/SOSModal';
import { DESTINATIONS, Destination } from '../data/mockData';
import { initFirebaseClient, mockAuth, mockDb } from '../utils/firebase';

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
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([
    {
      id: 'past-trip-1',
      name: 'South Goa Escape',
      date: '2026-03-14',
      status: 'Completed',
      itemsCount: 3
    }
  ]);

  const [user, setUser] = useState<any>(null);
  const [authObj, setAuthObj] = useState<any>(null);
  const [dbObj, setDbObj] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Sync auth session state
  useEffect(() => {
    let unsubscribe = () => {};

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
          
          // Sync profiles to local storage
          if (!currentUser.isMock && !currentUser.isGuest && activeDb) {
            activeDb.collection('users').doc(currentUser.uid).get().then((snap: any) => {
              if (snap.exists) {
                const cloud = snap.data();
                if (cloud) {
                  if (cloud.name) localStorage.setItem('gobro_user_name', cloud.name);
                  if (cloud.passport) localStorage.setItem('gobro_user_passport', cloud.passport);
                  if (cloud.homeCity) localStorage.setItem('gobro_user_home', cloud.homeCity);
                  if (cloud.contact) localStorage.setItem('gobro_user_contact', cloud.contact);
                  if (cloud.blood) localStorage.setItem('gobro_user_blood', cloud.blood);
                  
                  if (cloud.family1Name) localStorage.setItem('gobro_fam1_name', cloud.family1Name);
                  if (cloud.family1Relation) localStorage.setItem('gobro_fam1_rel', cloud.family1Relation);
                  if (cloud.family1Phone) localStorage.setItem('gobro_fam1_phone', cloud.family1Phone);
                  
                  if (cloud.family2Name) localStorage.setItem('gobro_fam2_name', cloud.family2Name);
                  if (cloud.family2Relation) localStorage.setItem('gobro_fam2_rel', cloud.family2Relation);
                  if (cloud.family2Phone) localStorage.setItem('gobro_fam2_phone', cloud.family2Phone);
                  
                  if (cloud.friend1Name) localStorage.setItem('gobro_fr1_name', cloud.friend1Name);
                  if (cloud.friend1Phone) localStorage.setItem('gobro_fr1_phone', cloud.friend1Phone);
                  if (cloud.friend2Name) localStorage.setItem('gobro_fr2_name', cloud.friend2Name);
                  if (cloud.friend2Phone) localStorage.setItem('gobro_fr2_phone', cloud.friend2Phone);
                }
              }
            }).catch((e: any) => console.log("Failed to sync cloud profile data:", e));
          }
        } else {
          setUser(null);
        }
        setAuthChecking(false);
      });
    };

    setupAuthListener();

    return () => unsubscribe();
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
    setUpcomingTrips((prev) => [trip, ...prev]);
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
          />
        );
      case 'predict':
        return (
          <PredictView 
            selectedDest={selectedDest} 
            setSelectedDest={setSelectedDest} 
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
            isOffline={isOffline}
          />
        );
      case 'profile':
        return (
          <ProfileView
            lang={lang}
            setLang={handleSetLang}
            userArchetype={userArchetype}
            isOffline={isOffline}
            setIsOffline={setIsOffline}
            user={user}
            dbObj={dbObj}
            onLogout={handleLogout}
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

  return (
    <div className="relative min-h-screen flex flex-col bg-midnight-obsidian text-text-body overflow-x-hidden bg-accent-glow">
      
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
      />

      {/* Main Viewport */}
      <main className="flex-1 w-full relative z-10 flex flex-col items-center justify-center">
        {authChecking ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="h-10 w-10 text-velvet-rose animate-spin" />
            <p className="text-xs text-text-muted font-mono tracking-widest uppercase animate-pulse">
              Authenticating Traveler Gateway...
            </p>
          </div>
        ) : !user ? (
          <LoginView onLoginSuccess={(u, a, d) => {
            setUser(u);
            setAuthObj(a);
            setDbObj(d);
          }} />
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

      {/* Global SOS Drawer Modal */}
      <SOSModal 
        isOpen={isSOSOpen} 
        onClose={() => setIsSOSOpen(false)} 
        selectedDestName={selectedDest ? selectedDest.name : null}
      />

      {/* Footer */}
      <footer className="w-full py-6 bg-black/40 border-t border-white/5 text-center text-xs text-text-muted mt-12 relative z-10">
        <p>&copy; {new Date().getFullYear()} GOBRO AI Travel Platform. Built offline-first using client-side model weights.</p>
      </footer>

    </div>
  );
}
