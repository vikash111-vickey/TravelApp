'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Users, ShieldCheck, Database, Award, Trash2, Save, MapPin, Globe, Sparkles, Phone, Heart } from 'lucide-react';
import { useTranslation, LanguageCode } from '../utils/translations';
import { localDB } from '../utils/offlineCache';
import GlassCard from '../components/GlassCard';
import confetti from 'canvas-confetti';

interface ProfileViewProps {
  lang: string;
  setLang: (lang: string) => void;
  userArchetype: string;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  user?: any;
  dbObj?: any;
  onLogout?: () => void;
}

export default function ProfileView({
  lang,
  setLang,
  userArchetype,
  isOffline,
  setIsOffline,
  user,
  dbObj,
  onLogout
}: ProfileViewProps) {
  const { t } = useTranslation(lang as LanguageCode);

  const [username, setUsername] = useState('Alex Mercer');
  const [passport, setPassport] = useState('Z-9843621');
  const [homeCity, setHomeCity] = useState('Bengaluru, India');
  const [emergencyContact, setEmergencyContact] = useState('+91 98765 43210');
  const [bloodGroup, setBloodGroup] = useState('O+');

  const [family1Name, setFamily1Name] = useState('Jane Mercer');
  const [family1Relation, setFamily1Relation] = useState('Mother');
  const [family1Phone, setFamily1Phone] = useState('+91 99887 76655');

  const [family2Name, setFamily2Name] = useState('John Mercer');
  const [family2Relation, setFamily2Relation] = useState('Father');
  const [family2Phone, setFamily2Phone] = useState('+91 99000 11223');

  const [friend1Name, setFriend1Name] = useState('Rahul Verma');
  const [friend1Phone, setFriend1Phone] = useState('+91 98765 00123');

  const [friend2Name, setFriend2Name] = useState('Siddharth Sen');
  const [friend2Phone, setFriend2Phone] = useState('+91 98888 77777');

  const [isSaved, setIsSaved] = useState(false);
  const [dbStats, setDbStats] = useState({ itineraries: 0, polaroids: 0 });
  const [isPurged, setIsPurged] = useState(false);

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

    // Load profile from localStorage if present
    const savedName = localStorage.getItem('gobro_user_name');
    const savedPassport = localStorage.getItem('gobro_user_passport');
    const savedHome = localStorage.getItem('gobro_user_home');
    const savedContact = localStorage.getItem('gobro_user_contact');
    const savedBlood = localStorage.getItem('gobro_user_blood');

    const savedFam1Name = localStorage.getItem('gobro_fam1_name');
    const savedFam1Rel = localStorage.getItem('gobro_fam1_rel');
    const savedFam1Phone = localStorage.getItem('gobro_fam1_phone');
    const savedFam2Name = localStorage.getItem('gobro_fam2_name');
    const savedFam2Rel = localStorage.getItem('gobro_fam2_rel');
    const savedFam2Phone = localStorage.getItem('gobro_fam2_phone');
    const savedFr1Name = localStorage.getItem('gobro_fr1_name');
    const savedFr1Phone = localStorage.getItem('gobro_fr1_phone');
    const savedFr2Name = localStorage.getItem('gobro_fr2_name');
    const savedFr2Phone = localStorage.getItem('gobro_fr2_phone');

    if (savedName) setUsername(savedName);
    if (savedPassport) setPassport(savedPassport);
    if (savedHome) setHomeCity(savedHome);
    if (savedContact) setEmergencyContact(savedContact);
    if (savedBlood) setBloodGroup(savedBlood);

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
      if (dbObj && user && !user.isMock && !user.isGuest) {
        try {
          const docRef = dbObj.collection('users').doc(user.uid);
          const snap = await docRef.get();
          if (snap.exists) {
            const cloud = snap.data();
            if (cloud) {
              if (cloud.name) setUsername(cloud.name);
              if (cloud.passport) setPassport(cloud.passport);
              if (cloud.homeCity) setHomeCity(cloud.homeCity);
              if (cloud.contact) setEmergencyContact(cloud.contact);
              if (cloud.blood) setBloodGroup(cloud.blood);

              if (cloud.family1Name) setFamily1Name(cloud.family1Name);
              if (cloud.family1Relation) setFamily1Relation(cloud.family1Relation);
              if (cloud.family1Phone) setFamily1Phone(cloud.family1Phone);
              
              if (cloud.family2Name) setFamily2Name(cloud.family2Name);
              if (cloud.family2Relation) setFamily2Relation(cloud.family2Relation);
              if (cloud.family2Phone) setFamily2Phone(cloud.family2Phone);

              if (cloud.friend1Name) setFriend1Name(cloud.friend1Name);
              if (cloud.friend1Phone) setFriend1Phone(cloud.friend1Phone);

              if (cloud.friend2Name) setFriend2Name(cloud.friend2Name);
              if (cloud.friend2Phone) setFriend2Phone(cloud.friend2Phone);

              // Cache cloud values in local storage for offline continuity
              localStorage.setItem('gobro_user_name', cloud.name || '');
              localStorage.setItem('gobro_user_passport', cloud.passport || '');
              localStorage.setItem('gobro_user_home', cloud.homeCity || '');
              localStorage.setItem('gobro_user_contact', cloud.contact || '');
              localStorage.setItem('gobro_user_blood', cloud.blood || '');
              localStorage.setItem('gobro_fam1_name', cloud.family1Name || '');
              localStorage.setItem('gobro_fam1_rel', cloud.family1Relation || '');
              localStorage.setItem('gobro_fam1_phone', cloud.family1Phone || '');
              localStorage.setItem('gobro_fam2_name', cloud.family2Name || '');
              localStorage.setItem('gobro_fam2_rel', cloud.family2Relation || '');
              localStorage.setItem('gobro_fam2_phone', cloud.family2Phone || '');
              localStorage.setItem('gobro_fr1_name', cloud.friend1Name || '');
              localStorage.setItem('gobro_fr1_phone', cloud.friend1Phone || '');
              localStorage.setItem('gobro_fr2_name', cloud.friend2Name || '');
              localStorage.setItem('gobro_fr2_phone', cloud.friend2Phone || '');
            }
          }
        } catch (err) {
          console.warn("Could not retrieve profile from Firestore (network offline). Using cached local state:", err);
        }
      }
    };
    loadCloudProfile();
  }, [dbObj, user]);

  const handleSaveChanges = () => {
    localStorage.setItem('gobro_user_name', username);
    localStorage.setItem('gobro_user_passport', passport);
    localStorage.setItem('gobro_user_home', homeCity);
    localStorage.setItem('gobro_user_contact', emergencyContact);
    localStorage.setItem('gobro_user_blood', bloodGroup);
    localStorage.setItem('gobro_fam1_name', family1Name);
    localStorage.setItem('gobro_fam1_rel', family1Relation);
    localStorage.setItem('gobro_fam1_phone', family1Phone);
    localStorage.setItem('gobro_fam2_name', family2Name);
    localStorage.setItem('gobro_fam2_rel', family2Relation);
    localStorage.setItem('gobro_fam2_phone', family2Phone);
    localStorage.setItem('gobro_fr1_name', friend1Name);
    localStorage.setItem('gobro_fr1_phone', friend1Phone);
    localStorage.setItem('gobro_fr2_name', friend2Name);
    localStorage.setItem('gobro_fr2_phone', friend2Phone);
    
    // Sync profile to cloud database (Firestore) if logged in
    if (dbObj && user && !user.isMock && !user.isGuest) {
      dbObj.collection('users').doc(user.uid).set({
        name: username,
        passport,
        homeCity,
        contact: emergencyContact,
        blood: bloodGroup,
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
      }, { merge: true }).catch((err: any) => console.error("Failed to sync profile change to Firestore:", err));
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
            <div className="relative h-28 w-28 rounded-full bg-gradient-to-tr from-velvet-rose to-saffron-radiance p-1 shadow-2xl flex items-center justify-center">
              <div className="h-full w-full rounded-full bg-midnight-obsidian flex items-center justify-center text-white text-3xl font-bold font-display">
                {username.split(' ').map(w => w[0]).join('')}
              </div>
              <span className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-emerald-500 border-2 border-midnight-obsidian flex items-center justify-center text-[10px] text-white font-bold" title="Sync Status Active">
                ✓
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mt-4 font-display">{username}</h3>
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

          {/* Database cache status card */}
          <GlassCard hoverEffect={false} className="p-5 text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Database className="h-4.5 w-4.5 text-velvet-rose" /> {t('dbStatus')}
            </h4>

            <div className="space-y-3.5 text-xs text-text-muted">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>IndexedDB Plans:</span>
                <span className="text-white font-mono font-semibold">{dbStats.itineraries} saved</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Postcard Memories:</span>
                <span className="text-white font-mono font-semibold">{dbStats.polaroids} printed</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Local Caching Schema:</span>
                <span className="text-green-400 font-semibold uppercase">PWA Caches Ready</span>
              </div>
            </div>

            <button
              onClick={handlePurgeCaches}
              className="w-full mt-6 bg-red-950/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> {t('purgeCaches')}
            </button>
            {isPurged && (
              <span className="block text-[10px] text-green-400 text-center font-semibold mt-2">
                {t('purgedSuccess')}
              </span>
            )}
          </GlassCard>
        </div>

        {/* Right Side: Account and language settings form */}
        <div className="space-y-6 lg:col-span-2">
          <GlassCard hoverEffect={false} className="p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-3">
              {t('settings')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username Input */}
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

              {/* Home City Input */}
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

              {/* Passport Input */}
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
                <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Emergency Contact</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-text-muted" />
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3.5 pl-11 focus:outline-none focus:border-velvet-rose/50"
                  />
                </div>
              </div>

              {/* Blood Group */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Blood Group</label>
                <div className="relative">
                  <Heart className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-text-muted" />
                  <input
                    type="text"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    placeholder="e.g. O+, A-, B+"
                    className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-3.5 pl-11 focus:outline-none focus:border-velvet-rose/50"
                  />
                </div>
              </div>

              {/* Global Translation Selector - Relocated here! */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white uppercase tracking-wider block">{t('changeLang')}</label>
                <div className="flex border border-white/10 rounded-xl bg-black/45 p-1">
                  {['EN', 'HI', 'KN'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`flex-1 py-2.5 text-xs rounded-lg transition-colors font-bold ${
                        lang === l ? 'bg-velvet-rose text-white shadow-md' : 'text-text-muted hover:text-white'
                      }`}
                    >
                      {l === 'EN' ? 'English (EN)' : l === 'HI' ? 'हिंदी (HI)' : 'ಕನ್ನಡ (KN)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Family & Friends Contacts section */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="h-4.5 w-4.5 text-saffron-radiance" />
                Emergency Contacts (Family & Friends)
              </h4>
              <p className="text-[10px] text-text-muted">
                These individuals will receive SMS warnings and real-time coordinates if you click the distress SOS button.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Family Contact 1 */}
                <div className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3 text-left">
                  <span className="text-[10px] text-saffron-radiance font-mono font-bold uppercase block">Family Member #1</span>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={family1Name}
                      onChange={(e) => setFamily1Name(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-velvet-rose/50"
                    />
                    <input
                      type="text"
                      placeholder="Relation (e.g. Mother, Spouse)"
                      value={family1Relation}
                      onChange={(e) => setFamily1Relation(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-velvet-rose/50"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={family1Phone}
                      onChange={(e) => setFamily1Phone(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-velvet-rose/50"
                    />
                  </div>
                </div>

                {/* Family Contact 2 */}
                <div className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3 text-left">
                  <span className="text-[10px] text-saffron-radiance font-mono font-bold uppercase block">Family Member #2</span>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={family2Name}
                      onChange={(e) => setFamily2Name(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-velvet-rose/50"
                    />
                    <input
                      type="text"
                      placeholder="Relation"
                      value={family2Relation}
                      onChange={(e) => setFamily2Relation(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-velvet-rose/50"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={family2Phone}
                      onChange={(e) => setFamily2Phone(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-velvet-rose/50"
                    />
                  </div>
                </div>

                {/* Friend Contact 1 */}
                <div className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3 text-left">
                  <span className="text-[10px] text-velvet-rose font-mono font-bold uppercase block">Friend #1</span>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={friend1Name}
                      onChange={(e) => setFriend1Name(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-velvet-rose/50"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={friend1Phone}
                      onChange={(e) => setFriend1Phone(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-velvet-rose/50"
                    />
                  </div>
                </div>

                {/* Friend Contact 2 */}
                <div className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3 text-left">
                  <span className="text-[10px] text-velvet-rose font-mono font-bold uppercase block">Friend #2</span>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={friend2Name}
                      onChange={(e) => setFriend2Name(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-velvet-rose/50"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={friend2Phone}
                      onChange={(e) => setFriend2Phone(e.target.value)}
                      className="w-full bg-black/45 text-xs text-white border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-velvet-rose/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Offline-First telemetry settings */}
            <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Offline Connection Handshake</span>
                <span className="text-[10px] text-text-muted">Simulate disconnect parameters for checking local ML logic.</span>
              </div>
              <button
                onClick={() => setIsOffline(!isOffline)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isOffline 
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                    : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/35'
                }`}
              >
                {isOffline ? 'Offline Database Active' : 'Switch to Offline Mode'}
              </button>
            </div>

            {/* Save Buttons & Logout */}
            <div className="pt-4 flex flex-col items-stretch space-y-3.5">
              <button
                onClick={handleSaveChanges}
                className="w-full bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs py-4 rounded-2xl shadow-lg hover:scale-102 transition-transform flex items-center justify-center gap-1.5"
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
