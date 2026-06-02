'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Compass, Calendar, ShoppingBag, User, LayoutDashboard, Sparkles, TrendingUp, Wifi, WifiOff, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  cartCount: number;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  onTriggerSOS: () => void;
  profile?: { displayName: string; email: string; photoURL: string } | null;
  theme?: string;
  toggleTheme?: () => void;
  userLocation?: {
    lat: number;
    lng: number;
    city: string;
    accuracy: number;
    status: 'enabled' | 'denied' | 'prompt' | 'fetching';
  } | null;
  triggerLocationRequest?: () => void;
}

export default function Navbar({
  activeView,
  setActiveView,
  cartCount,
  isOffline,
  setIsOffline,
  onTriggerSOS,
  profile,
  theme = 'dark',
  toggleTheme,
  userLocation,
  triggerLocationRequest
}: NavbarProps) {

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    badge?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Explore', icon: Compass },
    { id: 'predict', label: 'ML Insights', icon: TrendingUp },
    { id: 'itinerary', label: 'Planner', icon: Calendar },
    { id: 'booking', label: 'Bookings', icon: ShoppingBag, badge: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const mobileNavItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Explore', icon: Compass },
    { id: 'itinerary', label: 'Planner', icon: Calendar },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <>
      {/* Top Header Navbar - collapsed on screens < 768px */}
      <header className="hidden md:block sticky top-0 z-50 w-full px-4 py-3 md:px-8 no-print select-none">
        <nav className="mx-auto max-w-7xl rounded-full border border-white/10 bg-midnight-obsidian/70 px-6 py-2.5 backdrop-blur-xl shadow-lg flex items-center justify-between">
          
          {/* Logo / Brand */}
          <div 
            onClick={() => setActiveView('home')} 
            className="flex cursor-pointer items-center space-x-2 font-display text-xl font-bold tracking-tight text-white"
          >
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-velvet-rose to-saffron-radiance text-white shadow-sm"
            >
              <Sparkles className="h-4.5 w-4.5" />
            </motion.div>
            <span>Wander<span className="bg-gradient-to-r from-saffron-radiance to-velvet-rose bg-clip-text text-transparent">Lens</span></span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`relative px-3.5 py-2 text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5 rounded-full cursor-pointer ${
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
                  {item.id === 'profile' && profile?.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt="Profile" 
                      className="h-4.5 w-4.5 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
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
          <div className="hidden lg:flex items-center space-x-3.5">
            {/* Live Geolocation Status Badge */}
            {userLocation && (
              <button
                onClick={triggerLocationRequest}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all backdrop-blur-md cursor-pointer group relative select-none ${
                  userLocation.status === 'enabled'
                    ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/30'
                    : userLocation.status === 'fetching'
                      ? 'border-saffron-radiance/20 bg-saffron-radiance/10 text-saffron-radiance animate-pulse'
                      : 'border-white/5 bg-white/5 text-text-muted hover:text-white'
                }`}
                title={userLocation.status === 'denied' ? 'Click to enable location permissions' : `Accuracy: ~${Math.round(userLocation.accuracy)}m. Click to refresh.`}
              >
                {userLocation.status === 'enabled' ? (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span>📍 {userLocation.city}</span>
                  </>
                ) : userLocation.status === 'fetching' ? (
                  <>
                    <span className="animate-spin text-[10px] inline-block">🔄</span>
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
                    <span>📍 Location Off</span>
                    <span className="absolute bottom-full mb-2 hidden group-hover:block w-36 bg-black border border-white/10 p-2 rounded-lg text-[8px] text-white text-center leading-normal shadow-xl z-50">
                      Permission denied. Click to trigger prompt or enter manual fallback in Explore.
                    </span>
                  </>
                )}
              </button>
            )}

            {profile && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                <img 
                  src={profile.photoURL} 
                  alt={profile.displayName} 
                  className="h-6.5 w-6.5 rounded-full object-cover border border-white/20"
                />
                <div className="flex flex-col text-left max-w-[100px] leading-tight">
                  <span className="text-[10px] font-bold text-white truncate">{profile.displayName}</span>
                  <span className="text-[8px] text-text-muted truncate font-mono">{profile.email}</span>
                </div>
              </div>
            )}
            
            {/* Global Emergency SOS Button */}
            <button
              onClick={onTriggerSOS}
              className="px-4 py-2 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-xs font-bold shadow-lg hover:bg-red-900 transition-all flex items-center gap-1 animate-pulse cursor-pointer"
              title="Emergency SOS Dispatch Alert"
            >
              🚨 SOS
            </button>

            {/* Theme Toggle Button */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
                title="Toggle Theme mode (Light / Dark)"
              >
                {theme === 'light' ? <Moon className="h-4.5 w-4.5 text-text-muted hover:text-white" /> : <Sun className="h-4.5 w-4.5 text-saffron-radiance hover:text-white" />}
              </button>
            )}

            {/* Prominent Offline Mode Simulator Toggle */}
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`px-4 py-2 rounded-full border transition-all text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer ${
                isOffline 
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/35'
              }`}
              title="Toggle client connection simulator"
            >
              {isOffline ? (
                <>
                  <WifiOff className="h-4.5 w-4.5 animate-pulse text-zinc-500" />
                  Offline
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
              className="flex items-center gap-1 rounded-full bg-gradient-to-r from-velvet-rose to-saffron-radiance px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-all cursor-pointer animate-shimmer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Quiz
            </button>
          </div>

          {/* Mobile menu action toggle (Compact headers - Offline Simulator Only) */}
          <div className="flex xl:hidden items-center space-x-2">
            <button 
              onClick={() => setIsOffline(!isOffline)}
              className={`p-2.5 rounded-full border cursor-pointer transition-all ${isOffline ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'}`}
              title="Toggle offline simulator"
            >
              {isOffline ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Floating Theme Toggle (top-right viewport) */}
      {toggleTheme && (
        <button
          onClick={toggleTheme}
          className="md:hidden fixed top-4 right-4 z-50 p-2.5 rounded-full bg-midnight-obsidian/85 border border-white/10 text-white shadow-lg backdrop-blur-md cursor-pointer select-none no-print"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-saffron-radiance" />}
        </button>
      )}


      {/* Mobile Sticky Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-midnight-obsidian/90 border-t border-white/10 backdrop-blur-xl px-4 py-2 flex items-center justify-around select-none no-print">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all cursor-pointer ${
                isActive ? 'text-white font-bold' : 'text-text-muted hover:text-white'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-active-pill"
                  className="absolute inset-0 bg-white/5 border border-white/5 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
              <div className="relative">
                {item.id === 'profile' && profile?.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt="Profile" 
                    className="h-6 w-6 rounded-full object-cover border border-white/25"
                  />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                {item.badge && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-velvet-rose text-[9px] font-bold text-white shadow-md animate-pulse">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-1 tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
