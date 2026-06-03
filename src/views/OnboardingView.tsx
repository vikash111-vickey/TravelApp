'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, MapPin, Check, Upload, Compass, ArrowRight, ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import confetti from 'canvas-confetti';

interface OnboardingViewProps {
  user: any;
  dbObj: any;
  onComplete: () => void;
}

const PRESET_AVATARS = [
  { name: 'Aria', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
  { name: 'Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { name: 'Lulu', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lulu' },
  { name: 'Milo', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo' },
  { name: 'Nala', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Nala' }
];

const PERSONAS = [
  { id: 'Adventure', name: 'Thrill Seeker', description: 'Scale high passes in Ladakh, hike mountain peaks, and experience white-water rafting.', icon: '🏔️' },
  { id: 'Spiritual', name: 'Mindful Wanderer', description: 'Observe sacred prayers on Varanasi ghats, tour ancient Hampi temples, and meditate.', icon: '🧘' },
  { id: 'Luxury', name: 'Leisure Connoisseur', description: 'Relax in heritage palaces, book premium stays, and enjoy curated fine-dining experiences.', icon: '👑' },
  { id: 'Budget', name: 'Backpack Explorer', description: 'Travel cost-effectively, explore local street food, and discover offbeat community-run home stays.', icon: '🎒' },
  { id: 'Family', name: 'Cozy Vacationer', description: 'Enjoy child-friendly tours, scenic Munnar spice plantations, and houseboat cruises.', icon: '🏡' }
];

const DESTINATIONS = [
  { id: 'varanasi', name: 'Varanasi', region: 'Uttar Pradesh', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&w=400&q=80' },
  { id: 'goa', name: 'Goa Coast', region: 'West Coast', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80' },
  { id: 'leh', name: 'Leh Ladakh', region: 'Himalayas', image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=400&q=80' },
  { id: 'munnar', name: 'Munnar Hills', region: 'Kerala', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=400&q=80' },
  { id: 'jaipur', name: 'Jaipur Forts', region: 'Rajasthan', image: 'https://images.unsplash.com/photo-1477584322811-5a3ec27aa053?auto=format&fit=crop&w=400&q=80' },
  { id: 'hampi', name: 'Hampi Ruins', region: 'Karnataka', image: 'https://images.unsplash.com/photo-1600100397608-f010e42ec197?auto=format&fit=crop&w=400&q=80' }
];

export default function OnboardingView({ user, dbObj, onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.email?.split('@')[0] || '');
  const [avatar, setAvatar] = useState(user?.photoURL || PRESET_AVATARS[0].url);
  const [persona, setPersona] = useState('Spiritual');
  const [selectedDests, setSelectedDests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDestination = (id: string) => {
    setSelectedDests((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (selectedDests.length !== 3) return;
    setIsSubmitting(true);

    try {
      // 1. Save to Auth currentUser record (Google or Email)
      if (user && typeof user.updateProfile === 'function') {
        await user.updateProfile({
          displayName: displayName.trim(),
          photoURL: avatar
        });
      }

      // 2. Save complete profile document to Firestore
      if (dbObj && user) {
        await dbObj.collection('users').doc(user.uid).set({
          name: displayName.trim(),
          photoURL: avatar,
          persona,
          favoriteDestinations: selectedDests,
          onboardingCompleted: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // 3. Cache values locally for instant offline loading
      if (user) {
        localStorage.setItem(`gobro_${user.uid}_user_name`, displayName.trim());
        localStorage.setItem(`gobro_${user.uid}_user_photo`, avatar);
        localStorage.setItem(`gobro_${user.uid}_user_persona`, persona);
        localStorage.setItem(`gobro_${user.uid}_favorite_destinations`, JSON.stringify(selectedDests));
      }

      // Trigger Celebration Confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      onComplete();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-16 flex flex-col justify-center min-h-[calc(100vh-160px)]">
      
      {/* Step Header Indicator */}
      <div className="w-full flex items-center justify-between mb-8 px-2 select-none">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-saffron-radiance uppercase">WanderLens Onboarding</span>
          <h2 className="text-sm font-semibold text-white">Setup Profile &bull; Step {step} of 3</h2>
        </div>
        <div className="flex space-x-1.5">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-6 bg-velvet-rose' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Steps Switcher */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 text-left"
          >
            <GlassCard className="p-6 md:p-8 bg-midnight-obsidian/80 border-white/10 text-left shadow-2xl relative overflow-hidden space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5 font-display">
                  <User className="h-5 w-5 text-saffron-radiance" /> Setup Traveler Identity
                </h3>
                <p className="text-[11px] text-text-muted mt-1">
                  Tell us your display name and choose a profile picture.
                </p>
              </div>

              {/* Display Name Input */}
              <div className="space-y-2">
                <label className="text-[10px] text-text-muted font-mono uppercase font-bold tracking-wider">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black/45 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-velvet-rose/50 transition-colors"
                />
              </div>

              {/* Avatar Selector */}
              <div className="space-y-3">
                <label className="text-[10px] text-text-muted font-mono uppercase font-bold tracking-wider block">Profile Photo</label>
                <div className="flex items-center space-x-6">
                  {/* Photo Preview */}
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-velvet-rose to-saffron-radiance p-0.5 shadow-lg overflow-hidden flex items-center justify-center">
                    <img src={avatar} alt="Avatar Preview" className="h-full w-full rounded-full object-cover bg-midnight-obsidian" />
                  </div>

                  {/* File Upload Selector */}
                  <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all cursor-pointer">
                    <Upload className="h-4 w-4 text-text-muted" /> Upload Picture
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                {/* Preset Avatars */}
                <div className="pt-2">
                  <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider block mb-2">Or select a cartoon explorer</span>
                  <div className="flex gap-2.5">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.name}
                        onClick={() => setAvatar(av.url)}
                        className={`h-11 w-11 rounded-full overflow-hidden border p-0.5 transition-all ${
                          avatar === av.url ? 'border-velvet-rose scale-110 shadow-lg' : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={av.url} alt={av.name} className="h-full w-full rounded-full bg-midnight-obsidian" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            <button
              onClick={() => setStep(2)}
              disabled={!displayName.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:scale-101 active:scale-99 transition-transform cursor-pointer shadow-lg disabled:opacity-40 disabled:pointer-events-none"
            >
              Continue to Step 2 <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 text-left"
          >
            <GlassCard className="p-6 md:p-8 bg-midnight-obsidian/80 border-white/10 text-left shadow-2xl relative overflow-hidden space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5 font-display">
                  🏔️ Select Travel Persona
                </h3>
                <p className="text-[11px] text-text-muted mt-1">
                  Which bucket-list travel style describes you best?
                </p>
              </div>

              {/* Persona Options list */}
              <div className="space-y-3">
                {PERSONAS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setPersona(p.id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                      persona === p.id
                        ? 'border-velvet-rose bg-velvet-rose/10 shadow-md'
                        : 'border-white/5 bg-white/2 hover:bg-white/5'
                    }`}
                  >
                    <div className="text-2xl mt-0.5">{p.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white">{p.name}</h4>
                      <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{p.description}</p>
                    </div>
                    {persona === p.id && (
                      <div className="h-5 w-5 rounded-full bg-velvet-rose flex items-center justify-center text-white text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-99 transition-transform"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:scale-101 active:scale-99 transition-transform cursor-pointer shadow-lg"
              >
                Continue to Step 3 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 text-left"
          >
            <GlassCard className="p-6 md:p-8 bg-midnight-obsidian/80 border-white/10 text-left shadow-2xl relative overflow-hidden space-y-5">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5 font-display">
                    <Compass className="h-5 w-5 text-saffron-radiance" /> Favorite Destinations
                  </h3>
                  <span className="text-[10px] font-mono bg-saffron-radiance/20 text-saffron-radiance px-2 py-0.5 rounded border border-saffron-radiance/30 font-bold">
                    {selectedDests.length} of 3 Selected
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  Pick exactly **3 destinations** you are most excited to explore.
                </p>
              </div>

              {/* Destinations Grid Selection */}
              <div className="grid grid-cols-2 gap-3.5">
                {DESTINATIONS.map((d) => {
                  const isSelected = selectedDests.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      onClick={() => toggleDestination(d.id)}
                      className={`relative aspect-video rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-saffron-radiance scale-102 ring-2 ring-saffron-radiance/25'
                          : 'border-white/10 opacity-80 hover:opacity-100 hover:scale-101'
                      }`}
                    >
                      <img src={d.image} alt={d.name} className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-2.5 left-3 text-left">
                        <span className="text-[8px] text-saffron-radiance font-mono uppercase tracking-wider block font-bold">
                          {d.region}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-0.5">{d.name}</h4>
                      </div>

                      {/* Selected check overlay */}
                      {isSelected && (
                        <div className="absolute top-2.5 right-3 h-5 w-5 rounded-full bg-saffron-radiance flex items-center justify-center text-black font-bold">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-99 transition-transform"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={handleFinish}
                disabled={selectedDests.length !== 3 || isSubmitting}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:scale-101 active:scale-99 transition-transform cursor-pointer shadow-lg disabled:opacity-40 disabled:pointer-events-none"
              >
                {isSubmitting ? 'Finalizing Profile...' : 'Finish Setup'} <Check className="h-4 w-4 animate-bounce" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
