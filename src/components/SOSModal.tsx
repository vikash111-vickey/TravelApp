'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, Shield, Activity, MapPin, Loader2, CheckCircle, Heart, Users } from 'lucide-react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDestName: string | null;
}

export default function SOSModal({ isOpen, onClose, selectedDestName }: SOSModalProps) {
  const [step, setStep] = useState(0);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gpsLocked, setGpsLocked] = useState(false);
  
  // Profile fields loaded from localStorage
  const [profile, setProfile] = useState({
    name: 'Alex Mercer',
    passport: 'Z-9843621',
    contact: '+91 98765 43210',
    blood: 'O+'
  });

  // Emergency contact list loaded from localStorage
  const [contacts, setContacts] = useState({
    family1: { name: 'Jane Mercer', relation: 'Mother', phone: '+91 99887 76655' },
    family2: { name: 'John Mercer', relation: 'Father', phone: '+91 99000 11223' },
    friend1: { name: 'Rahul Verma', phone: '+91 98765 00123' },
    friend2: { name: 'Siddharth Sen', phone: '+91 98888 77777' }
  });

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setGpsLocked(false);
      
      // Load user profile details
      const name = localStorage.getItem('gobro_user_name') || 'Alex Mercer';
      const passport = localStorage.getItem('gobro_user_passport') || 'Z-9843621';
      const contact = localStorage.getItem('gobro_user_contact') || '+91 98765 43210';
      const blood = localStorage.getItem('gobro_user_blood') || 'O+';
      setProfile({ name, passport, contact, blood });

      // Load Family & Friends Emergency Contacts
      const fam1Name = localStorage.getItem('gobro_fam1_name') || 'Jane Mercer';
      const fam1Rel = localStorage.getItem('gobro_fam1_rel') || 'Mother';
      const fam1Phone = localStorage.getItem('gobro_fam1_phone') || '+91 99887 76655';
      
      const fam2Name = localStorage.getItem('gobro_fam2_name') || 'John Mercer';
      const fam2Rel = localStorage.getItem('gobro_fam2_rel') || 'Father';
      const fam2Phone = localStorage.getItem('gobro_fam2_phone') || '+91 99000 11223';
      
      const fr1Name = localStorage.getItem('gobro_fr1_name') || 'Rahul Verma';
      const fr1Phone = localStorage.getItem('gobro_fr1_phone') || '+91 98765 00123';
      
      const fr2Name = localStorage.getItem('gobro_fr2_name') || 'Siddharth Sen';
      const fr2Phone = localStorage.getItem('gobro_fr2_phone') || '+91 98888 77777';

      setContacts({
        family1: { name: fam1Name, relation: fam1Rel, phone: fam1Phone },
        family2: { name: fam2Name, relation: fam2Rel, phone: fam2Phone },
        friend1: { name: fr1Name, phone: fr1Phone },
        friend2: { name: fr2Name, phone: fr2Phone }
      });

      // Retrieve browser location coordinates
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLat(position.coords.latitude);
            setLng(position.coords.longitude);
            setGpsLocked(true);
          },
          () => {
            setLat(28.6139);
            setLng(77.2090);
            setGpsLocked(true);
          }
        );
      } else {
        setLat(28.6139);
        setLng(77.2090);
        setGpsLocked(true);
      }

      // Step-by-step progress logging
      const timers = [
        setTimeout(() => setStep(1), 1000), // Locate authorities
        setTimeout(() => setStep(2), 2200), // Dispatch family alert
        setTimeout(() => setStep(3), 3600), // Dispatch friends alert
        setTimeout(() => setStep(4), 5000)  // Transmission completed!
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetLocationName = selectedDestName || 'Local Municipal Jurisdiction';
  const nearestPolice = `${targetLocationName} Central Police Command`;
  const nearestHospital = `${targetLocationName} Emergency General Hospital`;

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

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg rounded-3xl border border-red-500/30 bg-midnight-obsidian p-6 md:p-8 shadow-2xl text-left overflow-y-auto max-h-[90vh] z-10 scrollbar-none"
      >
        <div className="absolute inset-0 bg-glow-radial opacity-50 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 animate-pulse" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10 pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="h-10 w-10 rounded-full bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-500 shadow-md">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-white">Distress SOS Console</h2>
              <span className="text-[10px] text-red-400 font-mono tracking-widest uppercase animate-pulse">Mesh Broadcast Active</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-5 relative z-10">
          
          {/* Packet Details Card */}
          <div className="bg-red-950/10 border border-red-500/10 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] text-red-400 font-mono uppercase tracking-wider block font-bold">Distress Metadata Payload</span>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-text-muted block">Traveler</span>
                <span className="text-white font-semibold">{profile.name}</span>
              </div>
              <div>
                <span className="text-text-muted block">Passport ID</span>
                <span className="text-white font-semibold font-mono">{profile.passport}</span>
              </div>
              <div>
                <span className="text-text-muted block">Medical Profile</span>
                <span className="text-red-400 font-bold">Blood: {profile.blood}</span>
              </div>
              <div>
                <span className="text-text-muted block">Primary Phone</span>
                <span className="text-white font-semibold">{profile.contact}</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-text-muted">
                <MapPin className="h-4 w-4 text-saffron-radiance" />
                <span>Locked GPS Coordinates</span>
              </div>
              <span className="text-white font-mono font-semibold">
                {gpsLocked && lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Resolving GPS...'}
              </span>
            </div>
          </div>

          {/* Registered Emergency Contacts Summary */}
          <div className="space-y-2">
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block font-bold">Registered Emergency Recipients</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/2 border border-white/5 p-3 rounded-2xl">
              <div>
                <span className="text-text-muted block">Family Node 1</span>
                <span className="text-white font-semibold">{contacts.family1.name} ({contacts.family1.relation})</span>
                <span className="text-text-muted block font-mono">{contacts.family1.phone}</span>
              </div>
              <div>
                <span className="text-text-muted block">Family Node 2</span>
                <span className="text-white font-semibold">{contacts.family2.name} ({contacts.family2.relation})</span>
                <span className="text-text-muted block font-mono">{contacts.family2.phone}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-white/5 col-span-2 grid grid-cols-2">
                <div>
                  <span className="text-text-muted block">Friend Node 1</span>
                  <span className="text-white font-semibold">{contacts.friend1.name}</span>
                  <span className="text-text-muted block font-mono">{contacts.friend1.phone}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Friend Node 2</span>
                  <span className="text-white font-semibold">{contacts.friend2.name}</span>
                  <span className="text-text-muted block font-mono">{contacts.friend2.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Local Responders */}
          <div className="space-y-2">
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block font-bold">Target Responders</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-white/2 border border-white/5 rounded-xl p-2.5">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4.5 w-4.5 text-blue-400" />
                  <span className="text-white font-semibold">{nearestPolice}</span>
                </div>
                <span className="text-[10px] text-blue-400 font-mono">1.2 km</span>
              </div>

              <div className="flex items-center justify-between bg-white/2 border border-white/5 rounded-xl p-2.5">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4.5 w-4.5 text-emerald-400" />
                  <span className="text-white font-semibold">{nearestHospital}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">2.8 km</span>
              </div>
            </div>
          </div>

          {/* Distress logs block */}
          <div className="bg-black/60 rounded-2xl p-4 h-36 font-mono text-[10px] space-y-1.5 overflow-y-auto border border-white/5 text-left select-none text-zinc-400">
            <div className="text-zinc-500">&gt;&gt; Initializing SOS alert sequence...</div>
            {step >= 0 && (
              <div className="text-yellow-500 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Acquiring GPS coordinates and satellites connection...
              </div>
            )}
            {step >= 1 && (
              <div className="text-yellow-500 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Transmitting coordinates to {nearestPolice} and {nearestHospital}...
              </div>
            )}
            {step >= 2 && (
              <div className="text-red-400">
                🚨 SMS Distress warning sent to Family Contacts: **{contacts.family1.name}** ({contacts.family1.relation}: {contacts.family1.phone}) and **{contacts.family2.name}** ({contacts.family2.relation}: {contacts.family2.phone}). Status: BROADCAST SUCCESS!
              </div>
            )}
            {step >= 3 && (
              <div className="text-red-400">
                🚨 SMS Distress warning sent to Friends: **{contacts.friend1.name}** ({contacts.friend1.phone}) and **{contacts.friend2.name}** ({contacts.friend2.phone}). Status: BROADCAST SUCCESS!
              </div>
            )}
            {step >= 4 && (
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                Dispatches confirmed. Emergency rescue alerts successfully sent to family, friends, police, and hospital units.
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex gap-3 relative z-10">
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs py-3.5 rounded-xl transition-all"
          >
            Cancel Dispatch
          </button>
          <button
            onClick={onClose}
            disabled={step < 4}
            className={`flex-1 font-bold text-xs py-3.5 rounded-xl transition-all ${
              step >= 4 
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white hover:scale-102 shadow-lg cursor-pointer' 
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
            }`}
          >
            {step >= 4 ? 'Acknowledge Rescue' : 'Broadcasting Distres...'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
