'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Users, ShieldCheck, Database, Award, Trash2, Save, MapPin, Globe, Sparkles, Phone, Heart } from 'lucide-react';
import { useTranslation, LanguageCode } from '../utils/translations';
import { localDB } from '../utils/offlineCache';
import GlassCard from '../components/GlassCard';
import confetti from 'canvas-confetti';
import { initFirebaseClient } from '../utils/firebase';

interface ProfileViewProps {
  lang: string;
  setLang: (lang: string) => void;
  userArchetype: string;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  user?: any;
  dbObj?: any;
  onLogout?: () => void;
  upcomingTrips: any[];
  setActiveView: (view: string) => void;
  profile?: { displayName: string; email: string; photoURL: string } | null;
  onProfileSync?: () => void;
  userEmotion: { current: string; history: Array<{ date: string; emotion: string }> };
  updateEmotion: (emotion: string) => void;
  ecoKarma: number;
  updateKarma: (points: number) => void;
  culturalPassport: { stamps: string[]; challenges: Record<string, boolean>; dnaProfile: { spiritual: number; heritage: number; nature: number } };
  updatePassport: (updater: any) => void;
  ancestryMix: Record<string, number>;
  updateAncestry: (mix: Record<string, number>) => void;
  chronotype: string;
  updateChronotype: (chronotype: string) => void;
  showToast?: (message: string, type?: string) => void;
}

export default function ProfileView({
  lang,
  setLang,
  userArchetype,
  isOffline,
  setIsOffline,
  user,
  dbObj,
  onLogout,
  upcomingTrips,
  setActiveView,
  profile,
  onProfileSync,
  userEmotion,
  updateEmotion,
  ecoKarma,
  updateKarma,
  culturalPassport,
  updatePassport,
  ancestryMix,
  updateAncestry,
  chronotype,
  updateChronotype,
  showToast
}: ProfileViewProps) {
  const { t } = useTranslation(lang as LanguageCode);

  const [username, setUsername] = useState(user?.displayName || user?.email || 'Alex Mercer');
  const [passport, setPassport] = useState(user ? 'Not Provided' : 'Z-9843621');
  const [homeCity, setHomeCity] = useState(user ? 'Not Provided' : 'Bengaluru, India');
  const [emergencyContact, setEmergencyContact] = useState(user ? 'Not Provided' : '+91 98765 43210');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [userPhoto, setUserPhoto] = useState(user?.photoURL || '');
  const [bio, setBio] = useState('');
  const [preferences, setPreferences] = useState('');

  const [family1Name, setFamily1Name] = useState(user ? '' : 'Jane Mercer');
  const [family1Relation, setFamily1Relation] = useState(user ? '' : 'Mother');
  const [family1Phone, setFamily1Phone] = useState(user ? '' : '+91 99887 76655');

  const [family2Name, setFamily2Name] = useState(user ? '' : 'John Mercer');
  const [family2Relation, setFamily2Relation] = useState(user ? '' : 'Father');
  const [family2Phone, setFamily2Phone] = useState(user ? '' : '+91 99000 11223');

  const [friend1Name, setFriend1Name] = useState(user ? '' : 'Rahul Verma');
  const [friend1Phone, setFriend1Phone] = useState(user ? '' : '+91 98765 00123');

  const [friend2Name, setFriend2Name] = useState(user ? '' : 'Siddharth Sen');
  const [friend2Phone, setFriend2Phone] = useState(user ? '' : '+91 98888 77777');

  const [isSaved, setIsSaved] = useState(false);
  const [dbStats, setDbStats] = useState({ itineraries: 0, polaroids: 0 });
  const [isPurged, setIsPurged] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'passport' | 'karma' | 'ancestry' | 'wellness'>('settings');

  // New editing name states & storage/SOS telemetry states
  const [isEditingName, setIsEditingName] = useState(false);
  const [storageObj, setStorageObj] = useState<any>(null);
  const [sosHistory, setSosHistory] = useState<any[]>([]);

  // Synchronize with parent state
  useEffect(() => {
    if (profile) {
      if (profile.displayName) setUsername(profile.displayName);
      if (profile.photoURL) setUserPhoto(profile.photoURL);
    }
  }, [profile]);

  // Load cache stats on mount
  useEffect(() => {
    const fetchDbStats = async () => {
      try {
        const itineraries = await localDB.getItineraries();
        const polaroids = await localDB.getPolaroids();
        setDbStats({
          itineraries: itineraries.length,
          polaroids: polaroids.length
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchDbStats();

    // Query active storage instance
    initFirebaseClient().then((services) => {
      setStorageObj(services.storage);
    }).catch(console.warn);

    // Query active SOS alerts history logs
    const activeUid = user?.uid || 'guest';
    const cachedSosLogs = localStorage.getItem(`gobro_${activeUid}_sos_history`);
    if (cachedSosLogs) {
      try {
        setSosHistory(JSON.parse(cachedSosLogs));
      } catch (err) {
        console.error("Failed to parse SOS alert history log:", err);
      }
    }

    // Load profile from localStorage if present using user-scoped keys
    const uid = user?.uid || 'guest';
    const savedName = localStorage.getItem(`gobro_${uid}_user_name`);
    const savedPassport = localStorage.getItem(`gobro_${uid}_user_passport`);
    const savedHome = localStorage.getItem(`gobro_${uid}_user_home`);
    const savedContact = localStorage.getItem(`gobro_${uid}_user_contact`);
    const savedBlood = localStorage.getItem(`gobro_${uid}_user_blood`);
    const savedBio = localStorage.getItem(`gobro_${uid}_user_bio`);
    const savedPreferences = localStorage.getItem(`gobro_${uid}_user_preferences`);
    const savedPhoto = localStorage.getItem(`gobro_${uid}_user_photo`);

    const savedFam1Name = localStorage.getItem(`gobro_${uid}_fam1_name`);
    const savedFam1Rel = localStorage.getItem(`gobro_${uid}_fam1_rel`);
    const savedFam1Phone = localStorage.getItem(`gobro_${uid}_fam1_phone`);
    const savedFam2Name = localStorage.getItem(`gobro_${uid}_fam2_name`);
    const savedFam2Rel = localStorage.getItem(`gobro_${uid}_fam2_rel`);
    const savedFam2Phone = localStorage.getItem(`gobro_${uid}_fam2_phone`);
    const savedFr1Name = localStorage.getItem(`gobro_${uid}_fr1_name`);
    const savedFr1Phone = localStorage.getItem(`gobro_${uid}_fr1_phone`);
    const savedFr2Name = localStorage.getItem(`gobro_${uid}_fr2_name`);
    const savedFr2Phone = localStorage.getItem(`gobro_${uid}_fr2_phone`);

    if (savedName) {
      setUsername(savedName);
    } else if (user) {
      const initialName = user.displayName || user.email || 'Alex Mercer';
      setUsername(initialName);
      localStorage.setItem(`gobro_${uid}_user_name`, initialName);
    } else {
      setUsername('Alex Mercer');
    }

    if (savedPassport) setPassport(savedPassport);
    if (savedHome) setHomeCity(savedHome);
    if (savedContact) setEmergencyContact(savedContact);
    if (savedBlood) setBloodGroup(savedBlood);
    if (savedBio) setBio(savedBio);
    if (savedPreferences) setPreferences(savedPreferences);
    if (savedPhoto) {
      setUserPhoto(savedPhoto);
    } else {
      setUserPhoto(user?.photoURL || '');
    }

    if (savedFam1Name) setFamily1Name(savedFam1Name);
    if (savedFam1Rel) setFamily1Relation(savedFam1Rel);
    if (savedFam1Phone) setFamily1Phone(savedFam1Phone);
    if (savedFam2Name) setFamily2Name(savedFam2Name);
    if (savedFam2Rel) setFamily2Relation(savedFam2Rel);
    if (savedFam2Phone) setFamily2Phone(savedFam2Phone);
    if (savedFr1Name) setFriend1Name(savedFr1Name);
    if (savedFr1Phone) setFriend1Phone(savedFr1Phone);
    if (savedFr2Name) setFriend2Name(savedFr2Name);
    if (savedFr2Phone) setFriend2Phone(savedFr2Phone);

    // Sync from cloud database (Firestore) if connected
    const loadCloudProfile = async () => {
      if (dbObj && user) {
        try {
          const docRef = dbObj.collection('users').doc(user.uid);
          const snap = await docRef.get();
          if (snap.exists) {
            const cloud = snap.data();
            if (cloud) {
              const cloudUid = user.uid;
              setUsername(cloud.name || username || 'Alex Mercer');
              setPassport(cloud.passport || 'Not Provided');
              setHomeCity(cloud.homeCity || 'Not Provided');
              setEmergencyContact(cloud.contact || 'Not Provided');
              setBloodGroup(cloud.blood || 'O+');
              setBio(cloud.bio || '');
              setPreferences(cloud.preferences || '');
              if (cloud.photoURL) setUserPhoto(cloud.photoURL);

              setFamily1Name(cloud.family1Name || '');
              setFamily1Relation(cloud.family1Relation || '');
              setFamily1Phone(cloud.family1Phone || '');
              
              setFamily2Name(cloud.family2Name || '');
              setFamily2Relation(cloud.family2Relation || '');
              setFamily2Phone(cloud.family2Phone || '');

              setFriend1Name(cloud.friend1Name || '');
              setFriend1Phone(cloud.friend1Phone || '');

              setFriend2Name(cloud.friend2Name || '');
              setFriend2Phone(cloud.friend2Phone || '');

              // Cache cloud values in local storage for offline continuity (using scoped keys)
              localStorage.setItem(`gobro_${cloudUid}_user_name`, cloud.name || username || 'Alex Mercer');
              localStorage.setItem(`gobro_${cloudUid}_user_passport`, cloud.passport || 'Not Provided');
              localStorage.setItem(`gobro_${cloudUid}_user_home`, cloud.homeCity || 'Not Provided');
              localStorage.setItem(`gobro_${cloudUid}_user_contact`, cloud.contact || 'Not Provided');
              localStorage.setItem(`gobro_${cloudUid}_user_blood`, cloud.blood || 'O+');
              localStorage.setItem(`gobro_${cloudUid}_user_bio`, cloud.bio || '');
              localStorage.setItem(`gobro_${cloudUid}_user_preferences`, cloud.preferences || '');
              localStorage.setItem(`gobro_${cloudUid}_user_photo`, cloud.photoURL || userPhoto || '');
              localStorage.setItem(`gobro_${cloudUid}_fam1_name`, cloud.family1Name || '');
              localStorage.setItem(`gobro_${cloudUid}_fam1_rel`, cloud.family1Relation || '');
              localStorage.setItem(`gobro_${cloudUid}_fam1_phone`, cloud.family1Phone || '');
              localStorage.setItem(`gobro_${cloudUid}_fam2_name`, cloud.family2Name || '');
              localStorage.setItem(`gobro_${cloudUid}_fam2_rel`, cloud.family2Relation || '');
              localStorage.setItem(`gobro_${cloudUid}_fam2_phone`, cloud.family2Phone || '');
              localStorage.setItem(`gobro_${cloudUid}_fr1_name`, cloud.friend1Name || '');
              localStorage.setItem(`gobro_${cloudUid}_fr1_phone`, cloud.friend1Phone || '');
              localStorage.setItem(`gobro_${cloudUid}_fr2_name`, cloud.friend2Name || '');
              localStorage.setItem(`gobro_${cloudUid}_fr2_phone`, cloud.friend2Phone || '');
            }
          }
        } catch (err: any) {
          if (err?.message?.includes('offline') || err?.code === 'unavailable') {
            console.log("Firestore offline, loading traveler settings from local offline database.");
          } else {
            console.warn("Could not retrieve profile from Firestore. Using cached local state:", err);
          }
        }
      }
    };
    loadCloudProfile();
  }, [dbObj, user]);

  const handleSaveChanges = () => {
    const saveUid = user?.uid || 'guest';
    localStorage.setItem(`gobro_${saveUid}_user_name`, username);
    localStorage.setItem(`gobro_${saveUid}_user_passport`, passport);
    localStorage.setItem(`gobro_${saveUid}_user_home`, homeCity);
    localStorage.setItem(`gobro_${saveUid}_user_contact`, emergencyContact);
    localStorage.setItem(`gobro_${saveUid}_user_blood`, bloodGroup);
    localStorage.setItem(`gobro_${saveUid}_user_bio`, bio);
    localStorage.setItem(`gobro_${saveUid}_user_preferences`, preferences);
    localStorage.setItem(`gobro_${saveUid}_user_photo`, userPhoto);
    localStorage.setItem(`gobro_${saveUid}_fam1_name`, family1Name);
    localStorage.setItem(`gobro_${saveUid}_fam1_rel`, family1Relation);
    localStorage.setItem(`gobro_${saveUid}_fam1_phone`, family1Phone);
    localStorage.setItem(`gobro_${saveUid}_fam2_name`, family2Name);
    localStorage.setItem(`gobro_${saveUid}_fam2_rel`, family2Relation);
    localStorage.setItem(`gobro_${saveUid}_fam2_phone`, family2Phone);
    localStorage.setItem(`gobro_${saveUid}_fr1_name`, friend1Name);
    localStorage.setItem(`gobro_${saveUid}_fr1_phone`, friend1Phone);
    localStorage.setItem(`gobro_${saveUid}_fr2_name`, friend2Name);
    localStorage.setItem(`gobro_${saveUid}_fr2_phone`, friend2Phone);
    
    // Sync auth user profile display name
    if (user && typeof user.updateProfile === 'function') {
      user.updateProfile({ displayName: username }).catch((err: any) => console.warn("Failed to update Auth display name:", err));
    }

    // Sync profile to cloud database (Firestore) if logged in
    if (dbObj && user) {
      dbObj.collection('users').doc(user.uid).set({
        name: username,
        passport,
        homeCity,
        contact: emergencyContact,
        blood: bloodGroup,
        bio,
        preferences,
        photoURL: userPhoto,
        family1Name,
        family1Relation,
        family1Phone,
        family2Name,
        family2Relation,
        family2Phone,
        friend1Name,
        friend1Phone,
        friend2Name,
        friend2Phone,
        updatedAt: new Date().toISOString()
      }, { merge: true }).then(() => {
        if (onProfileSync) onProfileSync();
      }).catch((err: any) => {
        if (err?.message?.includes('offline') || err?.code === 'unavailable') {
          console.log("Firestore offline, profile updates queued locally.");
        } else {
          console.error("Failed to sync profile change to Firestore:", err);
        }
      });
    } else {
      if (onProfileSync) onProfileSync();
    }
    
    setIsSaved(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const handlePurgeCaches = async () => {
    if (confirm("Are you sure you want to purge all offline cached files and itineraries?")) {
      try {
        await localDB.clearAll();
        setDbStats({ itineraries: 0, polaroids: 0 });
        setIsPurged(true);
        setTimeout(() => setIsPurged(false), 3000);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uid = user?.uid || 'guest';
      
      // Fallback base64 representation first
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const base64Photo = reader.result;
          setUserPhoto(base64Photo);
          localStorage.setItem(`gobro_${uid}_user_photo`, base64Photo);
        }
      };
      reader.readAsDataURL(file);

      // Attempt Storage Upload
      if (storageObj && user && !user.isGuest && !isOffline) {
        try {
          const storageRef = storageObj.ref();
          const avatarRef = storageRef.child(`avatars/${uid}.jpg`);
          
          await avatarRef.put(file);
          const downloadUrl = await avatarRef.getDownloadURL();
          
          setUserPhoto(downloadUrl);
          localStorage.setItem(`gobro_${uid}_user_photo`, downloadUrl);
          
          if (user && typeof user.updateProfile === 'function') {
            await user.updateProfile({ photoURL: downloadUrl });
          }
          
          if (dbObj) {
            await dbObj.collection('users').doc(uid).set({
              photoURL: downloadUrl
            }, { merge: true });
          }
          
          if (onProfileSync) onProfileSync();
          
          confetti({
            particleCount: 50,
            spread: 40,
            origin: { y: 0.8 }
          });
        } catch (err) {
          console.warn("Storage upload failed, falling back to local base64:", err);
        }
      } else {
        // Fallback for guest or offline mode
        setTimeout(() => {
          if (user && typeof user.updateProfile === 'function') {
            const currentPhoto = localStorage.getItem(`gobro_${uid}_user_photo`) || '';
            user.updateProfile({ photoURL: currentPhoto }).catch(console.warn);
          }
          if (dbObj && user) {
            const currentPhoto = localStorage.getItem(`gobro_${uid}_user_photo`) || '';
            dbObj.collection('users').doc(uid).set({
              photoURL: currentPhoto
            }, { merge: true }).catch(console.warn);
          }
          if (onProfileSync) onProfileSync();
        }, 1000);
      }
    }
  };

  return (
    <div className={`w-full max-w-5xl mx-auto px-6 py-8 flex flex-col space-y-8 min-h-[calc(100vh-140px)] transition-all duration-300 ${
      isOffline ? 'filter saturate-75 opacity-90' : ''
    }`}>
      
      {/* Header */}
      <div>
        <span className="text-xs text-saffron-radiance font-semibold uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" /> 
          {isOffline ? 'Offline account schema active' : 'Secure profile dashboard sync active'}
        </span>
        <h1 className="text-3xl font-bold font-display text-white mt-1">{t('myProfile')}</h1>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
        
        {/* Left Side: Avatar & Gamified Badge Panel */}
        <div className="space-y-6 lg:col-span-1">
          <GlassCard glowColor="saffron" className="p-6 text-center flex flex-col items-center">
            {/* Avatar container */}
            <div className="relative h-28 w-28 rounded-full bg-gradient-to-tr from-velvet-rose to-saffron-radiance p-1 shadow-2xl flex items-center justify-center overflow-hidden group">
              {userPhoto ? (
                <img 
                  src={userPhoto} 
                  alt="Profile" 
                  className="h-full w-full rounded-full object-cover bg-midnight-obsidian"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-midnight-obsidian flex items-center justify-center text-white text-3xl font-bold font-display">
                  {username ? (username.includes('@') ? username.split('@')[0][0]?.toUpperCase() : username.split(' ').map((w: string) => w[0]).join('')) : 'U'}
                </div>
              )}
              
              {/* File Upload Overlay */}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer transition-opacity select-none">
                <span>Change Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>

              <span className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-emerald-500 border-2 border-midnight-obsidian flex items-center justify-center text-[10px] text-white font-bold" title="Sync Status Active">
                ✓
              </span>
            </div>

            {isEditingName ? (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => {
                  setIsEditingName(false);
                  handleSaveChanges();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingName(false);
                    handleSaveChanges();
                  }
                }}
                autoFocus
                className="w-full bg-black/60 text-center text-sm text-white border border-white/10 rounded-xl py-1.5 px-2 focus:outline-none focus:border-velvet-rose/50 font-bold mt-4"
              />
            ) : (
              <h3 className="text-lg font-bold text-white mt-4 font-display flex items-center justify-center gap-1.5 truncate max-w-full" title={username}>
                {username}
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-all cursor-pointer"
                  title="Edit Name Inline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.013a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                </button>
              </h3>
            )}
            {user?.email && (
              <p className="text-xs text-text-muted mt-1 font-mono select-all truncate max-w-full" title={user.email}>{user.email}</p>
            )}
            <p className="text-[10px] text-saffron-radiance uppercase font-mono tracking-widest mt-0.5">
              {userArchetype ? `${userArchetype} Archetype` : 'Standard Explorer'}
            </p>

            {/* Level meter */}
            <div className="w-full mt-6 space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-text-muted">
                <span>{t('level')} 42</span>
                <span className="text-white">8,450 / 10,000 XP</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-velvet-rose to-saffron-radiance w-[84%]" />
              </div>
            </div>

            {/* Traveler Badges */}
            <div className="w-full mt-6 pt-6 border-t border-white/5 text-left">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-3 flex items-center gap-1">
                <Award className="h-4.5 w-4.5 text-saffron-radiance" /> {t('badges')}
              </span>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white/5 border border-white/10 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  🧘 Spiritual Seeker
                </span>
                <span className="bg-white/5 border border-white/10 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  🥦 Sattvik Foodie
                </span>
                <span className="bg-white/5 border border-white/10 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  🍃 Carbon Conscious
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Travel Stats Grid Card */}
          <GlassCard hoverEffect={false} className="p-5 text-left space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Database className="h-4.5 w-4.5 text-velvet-rose" /> Traveler Stats & Caches
            </h4>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 w-full text-center py-2 select-none">
              <div className="bg-white/5 border border-white/10 rounded-xl py-3 px-2">
                <span className="text-lg font-black text-white font-mono block">
                  {upcomingTrips ? upcomingTrips.length : 0}
                </span>
                <span className="text-[8px] text-text-muted uppercase tracking-wider block font-bold mt-0.5">Planned</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl py-3 px-2">
                <span className="text-lg font-black text-white font-mono block">
                  {upcomingTrips ? upcomingTrips.filter(t => t.status === 'Completed').length + 1 : 1}
                </span>
                <span className="text-[8px] text-text-muted uppercase tracking-wider block font-bold mt-0.5">Visited</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl py-3 px-2">
                <span className="text-lg font-black text-white font-mono block">
                  {dbStats.itineraries}
                </span>
                <span className="text-[8px] text-text-muted uppercase tracking-wider block font-bold mt-0.5">Saved</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-text-muted border-t border-white/5 pt-3">
              <div className="flex justify-between">
                <span>Postcard Memories:</span>
                <span className="text-white font-mono font-semibold">{dbStats.polaroids} printed</span>
              </div>
              <div className="flex justify-between">
                <span>Caching Engine:</span>
                <span className="text-green-400 font-semibold uppercase">PWA Active</span>
              </div>
            </div>

            <button
              onClick={handlePurgeCaches}
              className="w-full mt-2 bg-red-950/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 font-bold text-[10px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Offline Caches
            </button>
            {isPurged && (
              <span className="block text-[10px] text-green-400 text-center font-semibold mt-1">
                Caches successfully purged!
              </span>
            )}
          </GlassCard>

          {/* My Bookings Summary Card */}
          <GlassCard hoverEffect={true} onClick={() => setActiveView('booking')} className="p-5 text-left cursor-pointer border-white/5 bg-white/2 hover:scale-[1.01] transition-transform space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <span>🎫</span> My Bookings Summary
            </h4>
            {upcomingTrips && upcomingTrips.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white font-semibold truncate max-w-[130px]">{upcomingTrips[0].name}</span>
                  <span className="text-[9px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">{upcomingTrips[0].status}</span>
                </div>
                <p className="text-[10px] text-text-muted">Scheduled Date: {upcomingTrips[0].date}</p>
                <div className="text-[10px] text-saffron-radiance font-bold flex items-center gap-0.5 pt-1">
                  Manage simulated bookings &rarr;
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted leading-relaxed">No active bookings. Generate a plan and checkout to sync vouchers.</p>
            )}
          </GlassCard>
        </div>

        {/* Right Side: Account and settings tabs form */}
        <div className="space-y-6 lg:col-span-2">
          <GlassCard hoverEffect={false} className="p-6 md:p-8 space-y-6">
            
            {/* Horizontal sub-navigation tabs */}
            <div className="flex border-b border-white/5 pb-2 overflow-x-auto gap-2 scrollbar-none select-none">
              {(['settings', 'passport', 'karma', 'ancestry', 'wellness'] as const).map(tab => {
                const labels: Record<string, string> = {
                  settings: '⚙️ Settings',
                  passport: '🪪 Passport',
                  karma: '🌳 Eco Tree',
                  ancestry: '🧬 Ancestry',
                  wellness: '💙 Wellness'
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-xl font-bold font-mono text-[10px] uppercase transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === tab 
                        ? 'bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white shadow-md' 
                        : 'bg-white/5 text-text-muted hover:text-white'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Tab Inner Views */}
            <div className="mt-4">
              
              {/* 1. Account Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">{t('username')}</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-text-muted" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3.5 pl-11 focus:outline-none focus:border-velvet-rose/50"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Email Address (Linked)</label>
                      <input
                        type="email"
                        value={user?.email || 'N/A'}
                        readOnly
                        className="w-full bg-black/25 text-xs text-text-muted border border-white/5 rounded-xl p-3.5 cursor-not-allowed font-mono"
                      />
                    </div>

                    {/* Home City */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">{t('homeCity')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-text-muted" />
                        <input
                          type="text"
                          value={homeCity}
                          onChange={(e) => setHomeCity(e.target.value)}
                          className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3.5 pl-11 focus:outline-none focus:border-velvet-rose/50"
                        />
                      </div>
                    </div>

                    {/* Passport */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">{t('passport')}</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-text-muted" />
                        <input
                          type="text"
                          value={passport}
                          onChange={(e) => setPassport(e.target.value)}
                          className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3.5 pl-11 focus:outline-none focus:border-velvet-rose/50"
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Emergency Call Node</label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3.5 focus:outline-none focus:border-velvet-rose/50"
                      />
                    </div>

                    {/* Blood Group */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Blood Group</label>
                      <input
                        type="text"
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3.5 focus:outline-none focus:border-velvet-rose/50"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5 text-left pt-4 border-t border-white/5">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Travel Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3 focus:outline-none"
                    />
                  </div>

                  {/* Preferences */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Travel Preferences & Interests</label>
                    <input
                      type="text"
                      value={preferences}
                      onChange={(e) => setPreferences(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3"
                    />
                  </div>

                  {/* Languages Selector */}
                  <div className="space-y-1.5 text-left pt-4 border-t border-white/5">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Change Language</label>
                    <div className="flex border border-white/10 rounded-xl bg-black/45 p-1 max-w-sm">
                      {['EN', 'HI', 'KN'].map((l) => (
                        <button
                          key={l}
                          onClick={() => setLang(l)}
                          className={`flex-1 py-2 text-xs rounded-lg transition-colors font-bold ${
                            lang === l ? 'bg-velvet-rose text-white shadow-md' : 'text-text-muted hover:text-white'
                          }`}
                        >
                          {l === 'EN' ? 'English' : l === 'HI' ? 'हिंदी' : 'ಕನ್ನಡ'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Contacts List */}
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Users className="h-4 w-4 text-saffron-radiance" />
                      Family & Friend Distress Responders
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Family Contact 1 */}
                      <div className="bg-white/2 border border-white/5 rounded-xl p-3.5 space-y-2">
                        <span className="text-[9px] text-saffron-radiance font-mono font-bold uppercase block">Family Member 1</span>
                        <input
                          type="text"
                          placeholder="Name"
                          value={family1Name}
                          onChange={(e) => setFamily1Name(e.target.value)}
                          className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Phone"
                          value={family1Phone}
                          onChange={(e) => setFamily1Phone(e.target.value)}
                          className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2 focus:outline-none"
                        />
                      </div>
                      {/* Family Contact 2 */}
                      <div className="bg-white/2 border border-white/5 rounded-xl p-3.5 space-y-2">
                        <span className="text-[9px] text-saffron-radiance font-mono font-bold uppercase block">Family Member 2</span>
                        <input
                          type="text"
                          placeholder="Name"
                          value={family2Name}
                          onChange={(e) => setFamily2Name(e.target.value)}
                          className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Phone"
                          value={family2Phone}
                          onChange={(e) => setFamily2Phone(e.target.value)}
                          className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SOS Logs */}
                  <div className="pt-6 border-t border-white/5 text-left">
                    <span className="text-xs font-bold text-white block mb-2">SOS Distress Transmission Logs</span>
                    {sosHistory && sosHistory.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-white/10 max-h-32 scrollbar-none">
                        <table className="min-w-full divide-y divide-white/5 text-[9px] font-mono text-text-muted text-left">
                          <thead className="bg-black/45 text-white">
                            <tr>
                              <th className="px-3 py-1.5">Timestamp</th>
                              <th className="px-3 py-1.5">Location</th>
                              <th className="px-3 py-1.5">Accuracy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {sosHistory.map((log: any, idx: number) => (
                              <tr key={idx} className="hover:bg-white/2">
                                <td className="px-3 py-1.5 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-3 py-1.5 truncate max-w-[120px]">{log.city}</td>
                                <td className="px-3 py-1.5 text-emerald-400">+/- {log.accuracy.toFixed(0)}m</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[10px] text-text-muted italic bg-white/1 p-3 rounded-xl border border-white/5">No distress events logged.</p>
                    )}
                  </div>

                  {/* Connection Handshake toggle */}
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Offline Mode Toggle</span>
                      <span className="text-[10px] text-text-muted">Simulate disconnect behavior offline.</span>
                    </div>
                    <button
                      onClick={() => setIsOffline(!isOffline)}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold font-mono transition-all ${
                        isOffline 
                          ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                          : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/35'
                      }`}
                    >
                      {isOffline ? 'Offline Database Active' : 'Switch Offline'}
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Cultural Immersion Passport Tab */}
              {activeTab === 'passport' && (
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                      📖 Digital Cultural Passport
                    </h4>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                      Stamps Unlocked: {culturalPassport.stamps.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {/* Stamps display */}
                    <div className="md:col-span-2 space-y-4">
                      <span className="text-[10px] text-saffron-radiance font-mono font-bold uppercase block">Stamps Collection</span>
                      <div className="grid grid-cols-3 gap-3 text-center select-none">
                        {/* Varanasi Stamp */}
                        <div className={`border p-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
                          culturalPassport.stamps.includes('varanasi')
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-white/2 border-white/5 opacity-30 text-text-muted'
                        }`}>
                          <span className="text-2xl mb-1">🛕</span>
                          <span className="text-[10px] font-bold font-mono">VARANASI</span>
                          <span className="text-[8px] opacity-75 font-mono">Witness of Eternity</span>
                          {culturalPassport.stamps.includes('varanasi') && (
                            <span className="text-[8px] mt-1.5 text-zinc-300 bg-black/40 px-1 py-0.5 rounded">
                              ✓ Never point feet to Ganga
                            </span>
                          )}
                        </div>

                        {/* Kerala Stamp */}
                        <div className={`border p-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
                          culturalPassport.stamps.includes('kerala')
                            ? 'bg-green-500/10 border-green-500/30 text-green-300'
                            : 'bg-white/2 border-white/5 opacity-30 text-text-muted'
                        }`}>
                          <span className="text-2xl mb-1">🎭</span>
                          <span className="text-[10px] font-bold font-mono">KERALA</span>
                          <span className="text-[8px] opacity-75 font-mono">Backwater Soul</span>
                          {culturalPassport.stamps.includes('kerala') && (
                            <span className="text-[8px] mt-1.5 text-zinc-300 bg-black/40 px-1 py-0.5 rounded">
                              ✓ Speak Malayalam phrases
                            </span>
                          )}
                        </div>

                        {/* Rajasthan Stamp */}
                        <div className={`border p-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
                          culturalPassport.stamps.includes('rajasthan')
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-white/2 border-white/5 opacity-30 text-text-muted'
                        }`}>
                          <span className="text-2xl mb-1">🏰</span>
                          <span className="text-[10px] font-bold font-mono">RAJASTHAN</span>
                          <span className="text-[8px] opacity-75 font-mono">Desert Dreamer</span>
                          {culturalPassport.stamps.includes('rajasthan') && (
                            <span className="text-[8px] mt-1.5 text-zinc-300 bg-black/40 px-1 py-0.5 rounded">
                              ✓ Turban-tying tutorial
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cultural Micro challenges */}
                      <div className="pt-4 border-t border-white/5">
                        <span className="text-[10px] text-velvet-rose font-mono font-bold uppercase block mb-3">Cultural Challenges & Missions</span>
                        <div className="space-y-2 text-xs">
                          {Object.keys(culturalPassport.challenges).map((challenge) => {
                            const labels: Record<string, string> = {
                              'attend-aarti': 'Attend morning aarti at Dashashwamedh Ghat in Varanasi',
                              'try-street-food': 'Try one street food flavor you cannot identify',
                              'speak-3-words': 'Speak 3 local words to a shopkeeper native to your area'
                            };
                            const isDone = culturalPassport.challenges[challenge];
                            return (
                              <button
                                key={challenge}
                                onClick={() => {
                                  updatePassport((prev: any) => {
                                    const nextChallenges = { ...prev.challenges, [challenge]: !isDone };
                                    
                                    // Unlock stamps based on challenges
                                    const nextStamps = [...prev.stamps];
                                    if (nextChallenges['attend-aarti'] && !nextStamps.includes('varanasi')) {
                                      nextStamps.push('varanasi');
                                    }
                                    if (nextChallenges['try-street-food'] && !nextStamps.includes('kerala')) {
                                      nextStamps.push('kerala');
                                    }
                                    if (nextChallenges['speak-3-words'] && !nextStamps.includes('rajasthan')) {
                                      nextStamps.push('rajasthan');
                                    }
                                    
                                    if (showToast) showToast(isDone ? `🔄 Reset challenge progress!` : `🏆 Completed challenge: ${labels[challenge]}!`, 'success');
                                    return { ...prev, challenges: nextChallenges, stamps: nextStamps };
                                  });
                                }}
                                className={`w-full text-left p-3 rounded-xl border flex justify-between items-center transition-colors ${
                                  isDone 
                                    ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-400' 
                                    : 'bg-white/2 border-white/5 text-text-muted hover:bg-white/5'
                                }`}
                              >
                                <span>{labels[challenge]}</span>
                                <span className="font-bold text-[10px] font-mono">{isDone ? '✓ DONE (+30 EXP)' : '○ COMPLETE'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* DNA Helix visualization sidebar */}
                    <div className="bg-white/2 border border-white/5 rounded-2xl p-4 flex flex-col justify-between items-center text-center">
                      <div className="space-y-3 w-full">
                        <span className="text-[10px] text-saffron-radiance uppercase font-mono font-bold block">Archetype Profile</span>
                        <h4 className="text-xs font-bold text-white font-display">Cultural DNA Helix</h4>

                        {/* Interactive vertical helix */}
                        <div className="h-44 w-12 mx-auto relative flex flex-col justify-between py-2 border-l border-r border-white/10 rounded">
                          {/* Helix strands using absolute nodes */}
                          {[1, 2, 3, 4, 5].map((i) => {
                            const offsetLeft = 2 + Math.sin(i * 1.5) * 16 + 16;
                            const offsetRight = 32 - Math.sin(i * 1.5) * 16;
                            return (
                              <div key={i} className="relative h-4 w-full">
                                <div className="absolute h-1 bg-white/20 top-1.5 left-2.5 right-2.5" />
                                <div 
                                  className="absolute h-3 w-3 rounded-full bg-velvet-rose shadow-md shadow-velvet-rose/40" 
                                  style={{ left: `${offsetLeft}px` }} 
                                />
                                <div 
                                  className="absolute h-3 w-3 rounded-full bg-saffron-radiance shadow-md shadow-saffron-radiance/40" 
                                  style={{ left: `${offsetRight}px` }} 
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-1 text-[10px] pt-2 text-left leading-relaxed text-text-muted">
                          <p className="flex justify-between">
                            <span>🧘 Spiritual Seeker:</span>
                            <span className="text-white font-mono font-bold">{culturalPassport.dnaProfile.spiritual}%</span>
                          </p>
                          <p className="flex justify-between">
                            <span>🏛️ Heritage Hunter:</span>
                            <span className="text-white font-mono font-bold">{culturalPassport.dnaProfile.heritage}%</span>
                          </p>
                          <p className="flex justify-between">
                            <span>🌿 Nature Nomad:</span>
                            <span className="text-white font-mono font-bold">{culturalPassport.dnaProfile.nature}%</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-[9px] font-mono text-purple-400 font-bold uppercase mt-2">
                        Helix Photo Chain Active
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Living Eco Karma Tree Tab */}
              {activeTab === 'karma' && (
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                      🌳 Living Eco-Karma Tree
                    </h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                      Points: {ecoKarma} KP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {/* SVG Tree Display */}
                    <div className="bg-black/55 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between text-center select-none">
                      <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold tracking-wider mb-2">Karma Growth Status</span>
                      
                      <svg width="120" height="150" className="mx-auto overflow-visible">
                        {/* Tree Trunk */}
                        <path d="M 60 140 Q 60 90 60 50" stroke="#78350f" strokeWidth="8" fill="none" strokeLinecap="round" />
                        <path d="M 60 85 Q 40 70 30 65" stroke="#78350f" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                        <path d="M 60 70 Q 80 55 90 48" stroke="#78350f" strokeWidth="4.5" fill="none" strokeLinecap="round" />

                        {/* Leaves depending on score */}
                        {ecoKarma < 150 ? (
                          // Wilted / Bare
                          <>
                            <circle cx="30" cy="65" r="4.5" fill="#f59e0b" opacity="0.8" />
                            <circle cx="90" cy="48" r="4.5" fill="#b45309" opacity="0.8" />
                            <circle cx="60" cy="50" r="5" fill="#78350f" opacity="0.7" />
                          </>
                        ) : ecoKarma < 400 ? (
                          // Growing Green
                          <>
                            <circle cx="30" cy="65" r="7" fill="#22c55e" opacity="0.9" />
                            <circle cx="90" cy="48" r="7" fill="#10b981" opacity="0.9" />
                            <circle cx="60" cy="50" r="10" fill="#15803d" opacity="0.95" />
                            <circle cx="50" cy="35" r="7" fill="#16a34a" opacity="0.9" />
                          </>
                        ) : (
                          // Blooming Flowers + Dense Leaves
                          <>
                            <circle cx="30" cy="65" r="9" fill="#15803d" />
                            <circle cx="90" cy="48" r="9" fill="#16a34a" />
                            <circle cx="60" cy="50" r="14" fill="#14532d" />
                            <circle cx="50" cy="30" r="11" fill="#166534" />
                            <circle cx="75" cy="35" r="10" fill="#15803d" />
                            {/* Pink flower buds */}
                            <circle cx="60" cy="38" r="3.5" fill="#ec4899" />
                            <circle cx="28" cy="62" r="3" fill="#f472b6" />
                            <circle cx="88" cy="45" r="3" fill="#ec4899" />
                            <circle cx="48" cy="24" r="3.5" fill="#f472b6" />
                          </>
                        )}
                      </svg>

                      <div className="mt-4 leading-tight">
                        <span className="text-xs font-bold text-white block">
                          {ecoKarma < 150 ? '🍂 Wilted Tree' : ecoKarma < 400 ? '🌱 Growing Bonsai' : '🌸 Blooming Eco-Karma Tree'}
                        </span>
                        <span className="text-[9px] text-text-muted">
                          {ecoKarma < 150 ? 'Your travel choices are carbon heavy' : ecoKarma < 400 ? 'Decent eco choices, continuing growth' : 'Exceptional carbon-offset planning!'}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Adjuster Slider & Leaderboard */}
                    <div className="md:col-span-2 space-y-4">
                      {/* Manual adjustments simulator */}
                      <div className="bg-white/3 border border-white/5 p-3 rounded-xl space-y-2">
                        <span className="text-[9px] text-saffron-radiance font-mono font-bold uppercase block">Simulate Eco-Karma Actions (Test)</span>
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              updateKarma(50);
                              if (showToast) showToast("🌿 Karma Alert: +50 KP for choosing Train over Flight!");
                            }}
                            className="bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-500/20 text-[9px] font-bold font-mono px-2 py-1 rounded"
                          >
                            +50 Choose Train
                          </button>
                          <button
                            onClick={() => {
                              updateKarma(-60);
                              if (showToast) showToast("⚠️ Karma Warning: -60 KP for Flight <500km!");
                            }}
                            className="bg-red-950/20 text-red-400 hover:bg-red-900/30 border border-red-500/30 text-[9px] font-bold font-mono px-2 py-1 rounded"
                          >
                            -60 Flight &lt;500km
                          </button>
                          <button
                            onClick={() => {
                              if (ecoKarma + 700 >= 1000) {
                                updateKarma(700);
                                confetti({ particleCount: 100, spread: 80 });
                                alert("🌳 Congratulations! You hit 1000 KP. Grow-Trees has planted a real tree in your name at coordinates: 12.4839° N, 75.8319° E. Serial Code: TREEDOM-WANDER-823.");
                              } else {
                                updateKarma(700);
                              }
                            }}
                            className="bg-purple-900/20 text-purple-400 hover:bg-purple-900/40 border border-purple-500/20 text-[9px] font-bold font-mono px-2 py-1 rounded"
                          >
                            +700 Max Offset (Tree Goal)
                          </button>
                        </div>
                      </div>

                      {/* Leaderboard list */}
                      <div className="pt-2">
                        <span className="text-[10px] text-velvet-rose font-mono font-bold uppercase block mb-2">Global Eco-Travel Leaderboard</span>
                        <div className="overflow-x-auto rounded-xl border border-white/5 leading-relaxed text-[10px]">
                          <div className="flex justify-between bg-black/45 p-2 font-bold text-white font-mono">
                            <span>Traveler</span>
                            <span>Points</span>
                          </div>
                          <div className="flex justify-between p-2 border-b border-white/5 bg-white/2">
                            <span>1. Aarav Sharma (Bengaluru, IN)</span>
                            <span className="font-bold text-emerald-400">1,240 KP</span>
                          </div>
                          <div className="flex justify-between p-2 border-b border-white/5 bg-white/2">
                            <span>2. Priya Nair (Kochi, IN)</span>
                            <span className="font-bold text-emerald-400">920 KP</span>
                          </div>
                          <div className="flex justify-between p-2 border-b border-white/5 bg-yellow-500/5 text-saffron-radiance font-bold">
                            <span>3. You (Your active account)</span>
                            <span>{ecoKarma} KP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Genetic Ancestry Tab */}
              {activeTab === 'ancestry' && (
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                      🧬 Genetic Ancestry Travel Engine
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {/* DNA Mix Percentages form */}
                    <div className="md:col-span-2 space-y-4">
                      <span className="text-[10px] text-saffron-radiance font-mono font-bold uppercase block">Genetic Heritage Composition</span>
                      <div className="space-y-3">
                        {Object.keys(ancestryMix).map((region) => (
                          <div key={region} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-zinc-300">
                              <span>{region}</span>
                              <span className="font-mono">{ancestryMix[region]}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={ancestryMix[region]}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...ancestryMix, [region]: val };
                                updateAncestry(updated);
                              }}
                              className="w-full h-1 bg-white/10 rounded-lg cursor-pointer accent-velvet-rose"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Fake DNA File upload sync */}
                      <div className="pt-4 border-t border-white/5">
                        <button
                          onClick={() => {
                            if (showToast) showToast("🧬 Parsing DNA sequences logs (.txt/23andMe file)...");
                            setTimeout(() => {
                              const synced = {
                                'South Indian Dravidian': 45,
                                'Rajput/North Indian': 15,
                                'Goan/Konkan': 30,
                                'Himalayan': 10
                              };
                              updateAncestry(synced);
                              if (showToast) showToast("✅ DNA ancestry profiles parsed successfully!", "success");
                            }, 1500);
                          }}
                          className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-mono font-bold text-white transition-all flex items-center justify-center gap-1.5 w-full cursor-pointer"
                        >
                          📁 Import AncestryDNA / 23andMe Data File
                        </button>
                      </div>
                    </div>

                    {/* Heritage Quests sidebar */}
                    <div className="bg-white/2 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                      <div className="space-y-2 text-left">
                        <span className="text-[10px] text-velvet-rose font-mono font-bold uppercase block">Ancestral Roots</span>
                        <h4 className="text-xs font-bold text-white font-display">Heritage Quests</h4>
                        <p className="text-[9px] text-text-muted leading-relaxed">
                          Your profile matches ancient corridors. Travel to matching locations to fulfill your lineage quests!
                        </p>
                        
                        <div className="pt-3 space-y-2 text-[9px] leading-tight font-mono text-text-muted">
                          <div className="border border-white/5 bg-black/40 p-2 rounded">
                            <p className="text-saffron-radiance font-bold">1. Hampi Citadel</p>
                            <p className="mt-1">Dravidian lineage matching. Quest: Visit Ruins (+100 KP)</p>
                          </div>
                          <div className="border border-white/5 bg-black/40 p-2 rounded">
                            <p className="text-saffron-radiance font-bold">2. Udaipur Fortresses</p>
                            <p className="mt-1">Rajput lineage matching. Quest: Photograph Palace (+100 KP)</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-[9px] text-center text-purple-400 font-mono font-bold uppercase pt-2">
                         lineage mapping ok
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Circadian Sleep & Emotional Wellness Tab */}
              {activeTab === 'wellness' && (
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                      💙 Circadian Optimization & Emotional Wellness
                    </h4>
                  </div>

                  {/* SVG Emotional Journey Graph */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-saffron-radiance font-mono font-bold uppercase block">Emotional Journey tracker (Mood Tracker)</span>
                    <div className="bg-black/45 border border-white/5 rounded-2xl p-4 h-[180px] flex flex-col justify-between">
                      
                      <svg width="100%" height="110" className="overflow-visible">
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="450" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                        <line x1="0" y1="50" x2="450" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                        <line x1="0" y1="80" x2="450" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

                        {/* Chart Line connecting dates */}
                        {/* Emotion values: Stressed = 90, Anxious = 75, Tired = 60, Neutral = 45, Excited = 30, Happy = 15 */}
                        <polyline
                          fill="none"
                          stroke="#ff2e93"
                          strokeWidth="2.5"
                          points="20,30 100,90 180,15 260,45 340,45"
                        />

                        {/* Nodes */}
                        <circle cx="20" cy="30" r="4.5" fill="#f59e0b" />
                        <circle cx="100" cy="90" r="4.5" fill="#ef4444" />
                        <circle cx="180" cy="15" r="4.5" fill="#22c55e" />
                        <circle cx="260" cy="45" r="4.5" fill="#c084fc" />
                        <circle cx="340" cy="45" r="4.5" fill="#ffffff" />
                      </svg>

                      {/* X Axis Labels */}
                      <div className="flex justify-between text-[8px] font-mono text-text-muted px-2 select-none pointer-events-none">
                        <span>05/25: Excited</span>
                        <span>05/27: Stressed</span>
                        <span>05/29: Happy</span>
                        <span>05/31: Neutral</span>
                        <span>Today: Neutral</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-4 border-t border-white/5">
                    {/* Circadian Chronotype selections */}
                    <div className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3">
                      <span className="text-[10px] text-velvet-rose font-mono font-bold uppercase block">Sleep Circadian Chronotype</span>
                      <div className="space-y-2 leading-relaxed">
                        <label className="text-[10px] text-text-muted font-bold block uppercase">Select Chronotype</label>
                        <select
                          value={chronotype}
                          onChange={(e) => {
                            updateChronotype(e.target.value);
                            if (showToast) showToast(`🕰️ Chronotype updated to: ${e.target.value}!`);
                          }}
                          className="w-full bg-black/45 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        >
                          <option value="Flexible">Flexible / Hybrid Sleep</option>
                          <option value="EarlyBird">Early Bird (Sunrise 5am active)</option>
                          <option value="NightOwl">Night Owl (Delayed start 10am + late tours)</option>
                        </select>
                        <span className="text-[9px] text-text-muted block mt-1">
                          Itineraries will auto-shift scheduled stops and times based on your circadian code profiles.
                        </span>
                      </div>
                    </div>

                    {/* Future Self Comparison widget */}
                    <div className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3 text-left">
                      <span className="text-[10px] text-saffron-radiance font-mono font-bold uppercase block">Future Self growth Simulator</span>
                      <div className="space-y-2 text-[10px] leading-normal text-text-muted">
                        <p className="font-semibold text-white">Pre-Trip vs Predicted Post-Trip (Solitude adaptation):</p>
                        <div className="space-y-1.5 font-mono">
                          <div>
                            <span className="block">Stress Levels:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-red-400">Current (82%)</span>
                              <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full w-[82%]" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-green-400">Predicted (28%)</span>
                              <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full w-[28%]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Save Buttons & Logout */}
            <div className="pt-4 flex flex-col items-stretch space-y-3.5 border-t border-white/5">
              <button
                onClick={handleSaveChanges}
                className="w-full bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs py-4 rounded-2xl shadow-lg hover:scale-102 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="h-4.5 w-4.5" /> {t('saveChanges')}
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full bg-white/5 hover:bg-red-950/20 hover:text-red-400 border border-white/10 hover:border-red-500/35 text-white font-bold text-xs py-3.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  🚪 Sign Out / Exit Account
                </button>
              )}

              {isSaved && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold rounded-xl text-center"
                >
                  {t('profileSaved')}
                </motion.div>
              )}
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
}
