'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users, DollarSign, Calendar, RefreshCw, BarChart2, ShieldAlert, BadgeInfo } from 'lucide-react';
import { Destination } from '../data/mockData';
import { constructDynamicDestination } from '../utils/dynamicDestination';
import { predictBudget, predictCrowdLevels, predictUserSatisfaction, CrowdPrediction, BudgetForecast } from '../utils/mlPredictor';
import GlassCard from '../components/GlassCard';

interface PredictViewProps {
  selectedDest: Destination | null;
  setSelectedDest: (dest: Destination) => void;
  userLocation?: {
    lat: number;
    lng: number;
    city: string;
    accuracy: number;
    status: 'enabled' | 'denied' | 'prompt' | 'fetching';
  } | null;
}

interface WeatherDay {
  dayName: string;
  tempMin: number;
  tempMax: number;
  rainProb: number;
  condition: 'Sunny' | 'Rainy' | 'Cloudy' | 'Windy';
  icon: string;
}

// Weather data generator helper
const generateWeatherData = (destName: string): WeatherDay[] => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let hash = 0;
  for (let i = 0; i < destName.length; i++) {
    hash = destName.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  return daysOfWeek.map((day, idx) => {
    const seed = hash + idx;
    const tempMin = 14 + (seed % 9); // 14 - 22
    const tempMax = tempMin + 6 + (seed % 7); // 20 - 35
    const rainProb = (seed % 6) * 20; // 0%, 20%, 40%, 60%, 80%, 100%
    const conditions: Array<'Sunny' | 'Rainy' | 'Cloudy' | 'Windy'> = ['Sunny', 'Cloudy', 'Rainy', 'Windy'];
    const condition = rainProb > 50 ? 'Rainy' : conditions[seed % conditions.length];
    const icons = {
      Sunny: '☀️',
      Cloudy: '☁️',
      Rainy: '🌧️',
      Windy: '💨'
    };

    return {
      dayName: day,
      tempMin,
      tempMax,
      rainProb,
      condition,
      icon: icons[condition]
    };
  });
};

const calculateComfortScore = (weather: WeatherDay[]) => {
  let scoreSum = 0;
  weather.forEach(day => {
    let dayScore = 10;
    dayScore -= (day.rainProb / 100) * 4;
    if (day.tempMax > 30) {
      dayScore -= (day.tempMax - 30) * 0.3;
    }
    if (day.tempMin < 18) {
      dayScore -= (18 - day.tempMin) * 0.3;
    }
    scoreSum += Math.max(1, Math.min(10, dayScore));
  });
  return (scoreSum / weather.length).toFixed(1);
};

export default function PredictView({ selectedDest, setSelectedDest, userLocation }: PredictViewProps) {
  const [activeDest, setActiveDest] = useState<Destination>(selectedDest || constructDynamicDestination('Bengaluru'));
  const [days, setDays] = useState(3);
  const [guests, setGuests] = useState(2);
  const [budgetTier, setBudgetTier] = useState<'budget' | 'premium' | 'luxury'>('premium');

  // ML State outputs
  const [crowdForecast, setCrowdForecast] = useState<CrowdPrediction[]>([]);
  const [budgetForecast, setBudgetForecast] = useState<BudgetForecast | null>(null);
  const [satisfaction, setSatisfaction] = useState<{ score: number; ecoImpactRating: 'high' | 'neutral' | 'poor' }>({ score: 85, ecoImpactRating: 'neutral' });
  const [isComputing, setIsComputing] = useState(false);

  useEffect(() => {
    if (selectedDest) {
      setActiveDest(selectedDest);
    } else {
      const cached = localStorage.getItem('gobro_last_selected_dest');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.name) {
            const fullDest = constructDynamicDestination(parsed.name);
            setActiveDest(fullDest);
          }
        } catch (e) {
          console.error('Failed to parse cached destination in predict view:', e);
        }
      }
    }
  }, [selectedDest]);

  // Run ML calculations whenever inputs alter
  useEffect(() => {
    setIsComputing(true);
    
    // Simulate model propagation delay
    const timer = setTimeout(() => {
      const crowd = predictCrowdLevels(activeDest.id);
      const basePriceMap: Record<string, number> = {
        varanasi: 4000,
        leh: 12000,
        goa: 8000,
        udaipur: 15000,
        munnar: 7000
      };
      const basePrice = basePriceMap[activeDest.id] || 5000;
      
      const budget = predictBudget(basePrice, days, guests, 'moderate', budgetTier);
      const sat = predictUserSatisfaction(activeDest.vegFriendly, activeDest.sustainabilityScore, budgetTier);
      
      setCrowdForecast(crowd);
      setBudgetForecast(budget);
      setSatisfaction(sat);
      setIsComputing(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [activeDest, days, guests, budgetTier]);

  const getCardinalCoords = (lat: number, lng: number) => {
    const latVal = Math.abs(lat).toFixed(4);
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngVal = Math.abs(lng).toFixed(4);
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${latVal}° ${latDir}, ${lngVal}° ${lngDir}`;
  };

  const isAtUserLocation = !!(userLocation && 
    userLocation.status === 'enabled' && 
    (activeDest.name.toLowerCase() === userLocation.city.toLowerCase() || 
     activeDest.name.toLowerCase() === 'my location' ||
     activeDest.name.toLowerCase() === 'current location'));

  const activeLat = isAtUserLocation ? userLocation.lat : activeDest.coordinates?.lat;
  const activeLng = isAtUserLocation ? userLocation.lng : activeDest.coordinates?.lng;

  const formattedTelemetryCoords = activeLat !== undefined && activeLng !== undefined 
    ? getCardinalCoords(activeLat, activeLng)
    : '0.0000° N, 0.0000° E';

  const weatherForecastName = isAtUserLocation && userLocation?.city ? userLocation.city : activeDest.name;
  const weatherForecast = generateWeatherData(weatherForecastName);
  const comfortScore = calculateComfortScore(weatherForecast);

  // Find optimal day (lowest crowd density)
  const optimalDay = crowdForecast.reduce((lowest, current) => {
    if (!lowest) return current;
    return current.crowdLevelPercent < lowest.crowdLevelPercent ? current : lowest;
  }, null as CrowdPrediction | null);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 flex flex-col space-y-8 min-h-[calc(100vh-140px)] text-left">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-saffron-radiance font-semibold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Client-Side ML Engine
          </span>
          <h1 className="text-3xl font-bold font-display text-white mt-1">Predictive Insights Dashboard</h1>
          <p className="text-xs text-text-muted mt-1.5 max-w-xl leading-relaxed">
            Adjust sliders to feed parameter tensors. Local regression algorithms forecast optimal travel slots, crowd scales, and pricing boundaries instantly.
          </p>
        </div>

        {/* Active Destination Target Badge */}
        <div className="space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono">Active Coordinate Telemetry</span>
          <span className="block text-xs font-bold text-white bg-white/5 border border-white/10 px-4.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md">
            📍 {isAtUserLocation && userLocation?.city ? userLocation.city : activeDest.name}
            <span className="text-text-muted font-mono ml-2 text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5">
              {formattedTelemetryCoords}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Input Param Tensors */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard hoverEffect={false} className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-saffron-radiance" />
              Input Feature Parameters
            </h3>

            {/* Slider 1: Days */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span>Trip Duration</span>
                <span className="text-saffron-radiance font-mono">{days} Days</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-saffron-radiance"
              />
            </div>

            {/* Slider 2: Guests */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span>Travelers Count</span>
                <span className="text-saffron-radiance font-mono">{guests} Guests</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-saffron-radiance"
              />
            </div>

            {/* Selector: Tier */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">Accommodation Tier</label>
              <div className="flex border border-white/10 rounded-xl bg-black/40 p-1 text-xs">
                {(['budget', 'premium', 'luxury'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setBudgetTier(t)}
                    className={`flex-1 py-2 rounded-lg capitalize transition-colors font-semibold ${
                      budgetTier === t ? 'bg-velvet-rose text-white' : 'text-text-muted hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Model calculations feedback state */}
            <div className="flex items-center justify-between text-[10px] text-text-muted font-mono pt-3 border-t border-white/5">
              <span>MODEL STATE:</span>
              {isComputing ? (
                <span className="text-saffron-radiance animate-pulse flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> RUNNING INFERENCE
                </span>
              ) : (
                <span className="text-green-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span> CALC READY
                </span>
              )}
            </div>
          </GlassCard>

          {/* Model telemetry feedback */}
          {budgetForecast && (
            <GlassCard hoverEffect={false} className="p-4 bg-white/2 space-y-3">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest block">Model Diagnostics</span>
              <div className="text-xs space-y-1.5 text-text-muted">
                <p>Satisfaction Rating: <span className="text-white font-semibold">{satisfaction.score}%</span></p>
                <p>Eco Impact Rating: <span className={`font-semibold ${satisfaction.ecoImpactRating === 'high' ? 'text-green-400' : 'text-saffron-radiance'}`}>{satisfaction.ecoImpactRating.toUpperCase()}</span></p>
                <p>Regression Confidence: <span className="text-white font-semibold">{budgetForecast.confidenceScore}%</span></p>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Side: Charts & Graph Outputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Crowd Levels Chart */}
          <GlassCard hoverEffect={false} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4.5 w-4.5 text-saffron-radiance" />
                7-Day Crowd Density Forecast
              </h3>
              {optimalDay && (
                <span className="bg-green-950/40 border border-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1">
                  💡 Best day to visit: {optimalDay.dayName} ({optimalDay.crowdLevelPercent}% load)
                </span>
              )}
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="w-full h-48 flex items-end justify-between pt-6 px-4 bg-black/35 rounded-2xl border border-white/5 relative">
              {crowdForecast.map((c, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  
                  {/* Hover tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 bg-midnight-obsidian border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono text-white pointer-events-none">
                    {c.crowdLevelPercent}% Load &bull; Conf: {c.confidence}%
                  </div>

                  {/* SVG Bar */}
                  <div className="w-6 sm:w-8 bg-gradient-to-t from-velvet-rose/40 to-saffron-radiance rounded-t-md transition-all duration-500 relative" style={{ height: `${c.crowdLevelPercent * 1.2}px` }}>
                    {/* Inner glowing pulse line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-white opacity-50 shadow-inner" />
                  </div>
                  
                  {/* Day Label */}
                  <span className="text-[10px] text-text-muted mt-2 truncate max-w-[36px] md:max-w-none">{c.dayName.substring(0, 3)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 text-[10px] text-text-muted font-mono justify-end">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-saffron-radiance"></span> High Density</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-velvet-rose/50"></span> Optimal Load</span>
            </div>
          </GlassCard>

          {/* 7-Day Weather & Comfort Forecast */}
          <GlassCard hoverEffect={false} className="space-y-4 text-left">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5 text-saffron-radiance" />
                7-Day Weather Forecast
              </h3>
              <span className="bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md select-none">
                Comfort Score: {comfortScore}/10
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-2">
              {weatherForecast.map((w, idx) => (
                <div key={idx} className="bg-white/3 border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-text-muted font-semibold">{w.dayName.substring(0, 3)}</span>
                  <span className="text-2xl my-1.5 select-none">{w.icon}</span>
                  <span className="text-xs font-bold text-white font-mono">{w.tempMin}°-{w.tempMax}°C</span>
                  <span className="text-[9px] text-blue-400 font-mono mt-1">☔ {w.rainProb}%</span>
                  <span className="text-[8px] text-text-muted mt-0.5">{w.condition}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-text-muted leading-relaxed font-medium">
              💡 Comfort Score is computed dynamically. Values between 8.0 and 10.0 represent excellent conditions for sightseeing and trekking.
            </p>
          </GlassCard>

          {/* Budget Regression Forecast */}
          {budgetForecast && (
            <GlassCard hoverEffect={false} className="space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4.5 w-4.5 text-green-400" />
                Budget & Expense Forecasting Bounds
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
                {/* Lower confidence */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-text-muted block font-semibold">Min Bounds (90% Conf)</span>
                  <span className="text-lg font-bold text-white block mt-1">₹ {budgetForecast.lowerConfidenceBound}</span>
                </div>

                {/* Estimate cost */}
                <div className="p-5 rounded-2xl bg-gradient-to-tr from-velvet-rose/15 to-saffron-radiance/15 border border-velvet-rose/30 shadow-lg shadow-velvet-rose/5">
                  <span className="text-[10px] text-saffron-radiance block font-bold uppercase tracking-wider">Median ML Estimate</span>
                  <span className="text-2xl font-black text-white block mt-1">₹ {budgetForecast.estimatedCost}</span>
                </div>

                {/* Upper confidence */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-text-muted block font-semibold">Max Bounds (90% Conf)</span>
                  <span className="text-lg font-bold text-white block mt-1">₹ {budgetForecast.upperConfidenceBound}</span>
                </div>
              </div>

              {/* Confidence margin bar visual representation */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-text-muted">
                  <span>₹ {budgetForecast.lowerConfidenceBound}</span>
                  <span className="text-saffron-radiance font-bold">Inference Target Range</span>
                  <span>₹ {budgetForecast.upperConfidenceBound}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 relative overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-velvet-rose via-saffron-radiance to-velvet-rose rounded-full"
                    style={{ left: '20%', right: '20%' }}
                  />
                </div>
              </div>
            </GlassCard>
          )}

        </div>

      </div>

    </div>
  );
}
