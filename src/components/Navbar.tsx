'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Calendar, ShoppingBag, User, LayoutDashboard, Menu, X, Sparkles, TrendingUp, Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  cartCount: number;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  onTriggerSOS: () => void;
}

export default function Navbar({
  activeView,
  setActiveView,
  cartCount,
  isOffline,
  setIsOffline,
  onTriggerSOS
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'discover', label: 'Explore', icon: Compass },
    { id: 'predict', label: 'ML Insights', icon: TrendingUp },
    { id: 'itinerary', label: 'Planner', icon: Calendar },
    { id: 'booking', label: 'Bookings', icon: ShoppingBag, badge: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3 md:px-8">
      <nav className="mx-auto max-w-7xl rounded-full border border-white/10 bg-midnight-obsidian/70 px-6 py-2.5 backdrop-blur-xl shadow-lg flex items-center justify-between">
        
        {/* Logo / Brand */}
        <div 
          onClick={() => setActiveView('home')} 
          className="flex cursor-pointer items-center space-x-2 font-display text-xl font-bold tracking-tight text-white select-none"
        >
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-velvet-rose to-saffron-radiance text-white shadow-sm"
          >
            <Sparkles className="h-4.5 w-4.5" />
          </motion.div>
          <span>GO<span className="bg-gradient-to-r from-saffron-radiance to-velvet-rose bg-clip-text text-transparent">BRO</span></span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setIsOpen(false);
                }}
                className={`relative px-3.5 py-2 text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5 rounded-full ${
                  isActive ? 'text-white' : 'text-text-muted hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute inset-0 bg-white/5 border border-white/10 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && cartCount > 0 && (
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-velvet-rose text-[10px] font-bold text-white shadow-inner animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls (Right) */}
        <div className="hidden lg:flex items-center space-x-4">
          
          {/* Global Emergency SOS Button */}
          <button
            onClick={onTriggerSOS}
            className="px-4 py-2 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-xs font-bold shadow-lg hover:bg-red-900 transition-all flex items-center gap-1 animate-pulse cursor-pointer"
            title="Emergency SOS Dispatch Alert"
          >
            🚨 SOS
          </button>

          {/* Prominent Offline Mode Simulator Toggle */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`px-4 py-2 rounded-full border transition-all text-xs font-bold flex items-center gap-1.5 shadow-md ${
              isOffline 
                ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/35'
            }`}
            title="Toggle client connection simulator"
          >
            {isOffline ? (
              <>
                <WifiOff className="h-4.5 w-4.5 animate-pulse text-zinc-500" />
                Offline Simulator
              </>
            ) : (
              <>
                <Wifi className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
                Online Sync
              </>
            )}
          </button>

          <button 
            onClick={() => setActiveView('quiz')}
            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-velvet-rose to-saffron-radiance px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Quiz
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex xl:hidden items-center space-x-2">
          {/* Mobile SOS Button */}
          <button
            onClick={onTriggerSOS}
            className="px-3.5 py-2 rounded-full bg-red-950 border border-red-500/30 text-red-400 text-[10px] font-bold animate-pulse shadow-md flex items-center gap-0.5 cursor-pointer"
          >
            🚨 SOS
          </button>

          {/* Offline indicator for mobile screen */}
          <button 
            onClick={() => setIsOffline(!isOffline)}
            className={`p-2 rounded-full border ${isOffline ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'}`}
          >
            {isOffline ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full border border-white/10 bg-white/5 text-white"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-4 right-4 z-40 rounded-3xl border border-white/10 bg-midnight-obsidian/95 p-6 backdrop-blur-2xl shadow-2xl xl:hidden flex flex-col space-y-4"
          >
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors ${
                      isActive ? 'bg-white/10 text-white border border-white/10' : 'text-text-muted hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                    {item.badge && cartCount > 0 && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-velvet-rose text-xs font-bold text-white">
                        {cartCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <hr className="border-white/10" />

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Branded Sandbox Connection</span>
              <button
                onClick={() => {
                  setIsOffline(!isOffline);
                  setIsOpen(false);
                }}
                className={`px-3 py-1.5 rounded-full border text-[10px] font-bold ${
                  isOffline ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-emerald-950 text-emerald-400 border-emerald-500/25'
                }`}
              >
                {isOffline ? 'Offline Active' : 'Go Offline'}
              </button>
            </div>

            <button
              onClick={() => {
                setActiveView('quiz');
                setIsOpen(false);
              }}
              className="w-full text-center rounded-xl bg-gradient-to-r from-velvet-rose to-saffron-radiance py-3 text-xs font-bold text-white shadow-md"
            >
              Start AI Quiz
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
