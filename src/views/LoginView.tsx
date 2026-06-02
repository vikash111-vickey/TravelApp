'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, LogIn, UserPlus, Globe, Sparkles, Loader2 } from 'lucide-react';
import { initFirebaseClient, mockAuth, mockDb } from '../utils/firebase';
import GlassCard from '../components/GlassCard';

interface LoginViewProps {
  onLoginSuccess: (user: any, authObj: any, dbObj: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [firebaseAuth, setFirebaseAuth] = useState<any>(null);
  const [firebaseDb, setFirebaseDb] = useState<any>(null);
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);
  const [loadingFirebase, setLoadingFirebase] = useState(true);

  // Initialize Firebase client on mount
  useEffect(() => {
    const setupFirebase = async () => {
      try {
        const { auth, db } = await initFirebaseClient();
        setFirebaseAuth(auth);
        setFirebaseDb(db);
        setIsFirebaseLoaded(true);
      } catch (err) {
        console.warn("Could not load Firebase. Falling back to local offline-only user database.");
        setFirebaseAuth(mockAuth);
        setFirebaseDb(mockDb);
        setIsFirebaseLoaded(false);
      } finally {
        setLoadingFirebase(false);
      }
    };
    setupFirebase();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all credentials.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const activeAuth = firebaseAuth || mockAuth;
    const activeDb = firebaseDb || mockDb;

    try {
      if (isRegister) {
        // Sign Up
        const credential = await activeAuth.createUserWithEmailAndPassword(email.trim(), password);
        const user = credential.user;

        // Initialize empty profile in database
        try {
          await activeDb.collection('users').doc(user.uid).set({
            name: email.split('@')[0],
            passport: 'Not Provided',
            contact: 'Not Provided',
            blood: 'O+',
            family1Name: '',
            family1Relation: '',
            family1Phone: '',
            family2Name: '',
            family2Relation: '',
            family2Phone: '',
            friend1Name: '',
            friend1Phone: '',
            friend2Name: '',
            friend2Phone: '',
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.error("Failed to seed database profile document:", dbErr);
        }

        onLoginSuccess(user, activeAuth, activeDb);
      } else {
        // Sign In
        const credential = await activeAuth.signInWithEmailAndPassword(email.trim(), password);
        onLoginSuccess(credential.user, activeAuth, activeDb);
      }
    } catch (err: any) {
      console.error("Authentication action failed:", err);
      // Map common Firebase errors
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMessage('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please check network.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    const activeAuth = firebaseAuth || mockAuth;
    const activeDb = firebaseDb || mockDb;
    
    try {
      let provider = null;
      const w = window as any;
      if (isFirebaseLoaded && w.firebase) {
        provider = new w.firebase.auth.GoogleAuthProvider();
      }
      
      const credential = await activeAuth.signInWithPopup(provider);
      const user = credential.user;
      
      // Seed profile if not exists
      try {
        const docRef = activeDb.collection('users').doc(user.uid);
        const snap = await docRef.get();
        if (!snap.exists) {
          await docRef.set({
            name: user.displayName || user.email.split('@')[0],
            passport: 'Not Provided',
            contact: 'Not Provided',
            blood: 'O+',
            family1Name: '',
            family1Relation: '',
            family1Phone: '',
            family2Name: '',
            family2Relation: '',
            family2Phone: '',
            friend1Name: '',
            friend1Phone: '',
            friend2Name: '',
            friend2Phone: '',
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (dbErr) {
        console.error("Failed to seed Google user profile:", dbErr);
      }
      
      onLoginSuccess(user, activeAuth, activeDb);
    } catch (err: any) {
      console.error("Google Sign In failed:", err);
      setErrorMessage(err.message || "Google Sign-In failed. Please check network.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    setIsLoading(true);
    setTimeout(() => {
      const guestUser = {
        uid: 'guest-explorer-' + Math.floor(Math.random() * 10000),
        email: 'guest@gobro.ai',
        isGuest: true
      };
      localStorage.setItem('gobro_guest_user', JSON.stringify(guestUser));
      onLoginSuccess(guestUser, mockAuth, mockDb);
      setIsLoading(false);
    }, 800);
  };

  if (loadingFirebase) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-velvet-rose animate-spin" />
        <p className="text-xs text-text-muted font-mono tracking-widest uppercase animate-pulse">
          Establishing Cloud Gateways...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-160px)]">
      
      {/* Brand Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 space-y-2"
      >
        <div className="inline-flex h-14 w-14 rounded-3xl bg-gradient-to-tr from-velvet-rose to-saffron-radiance p-0.5 shadow-lg shadow-velvet-rose/10 items-center justify-center text-white mb-2">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-extrabold font-display bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          WanderLens Copilot
        </h1>
        <p className="text-xs text-text-muted max-w-xs font-medium">
          Sign in to synchronize your profile, bookings, emergency contacts, and active logs to the cloud.
        </p>
      </motion.div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full"
      >
        <GlassCard className="p-6 md:p-8 bg-midnight-obsidian/80 border-white/10 text-left shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-glow-radial opacity-10 pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5 font-display">
              <Sparkles className="h-5 w-5 text-saffron-radiance" />
              {isRegister ? 'Create Account' : 'Traveler Portal'}
            </h2>
            
            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
              isFirebaseLoaded 
                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-950/20 text-amber-400 border-amber-500/20'
            }`}>
              {isFirebaseLoaded ? '● Cloud Connected' : '○ Offline Database'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-text-muted font-mono uppercase font-bold tracking-wider">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4.5 w-4.5 text-text-muted" />
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-black/45 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-velvet-rose/50 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-text-muted font-mono uppercase font-bold tracking-wider">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4.5 w-4.5 text-text-muted" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-black/45 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-velvet-rose/50 transition-colors"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-950/20 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 text-center font-medium font-mono"
              >
                ⚠️ {errorMessage}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:scale-101 active:scale-99 transition-transform cursor-pointer shadow-lg shadow-velvet-rose/10 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> Transmitting...
                </>
              ) : isRegister ? (
                <>
                  <UserPlus className="h-4.5 w-4.5" /> Initialize Credentials
                </>
              ) : (
                <>
                  <LogIn className="h-4.5 w-4.5" /> Enter Terminal
                </>
              )}
            </button>

            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-white text-zinc-900 border border-zinc-200 font-bold text-xs tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all cursor-pointer shadow-sm active:scale-99 disabled:opacity-50 disabled:pointer-events-none"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.32 -0.03,-0.64 -0.07,-0.89z" fill="#4285F4" />
                  <path d="M12,20.5c2.3,0 4.22,-0.76 5.63,-2.08l-3.3,-2.57c-0.91,0.61 -2.08,0.97 -3.33,0.97c-2.56,0 -4.73,-1.73 -5.5,-4.06H2.1v2.66c1.47,2.92 4.49,4.91 8.01,4.91z" fill="#34A853" />
                  <path d="M6.5,12.76c-0.19,-0.58 -0.3,-1.2 -0.3,-1.84c0,-0.64 0.11,-1.26 0.3,-1.84V6.42H2.1c-0.64,1.28 -1,2.72 -1,4.24c0,1.52 0.36,2.96 1,4.24l3.4,-2.66c0,-0.04 0,-0.08 0,-0.12z" fill="#FBBC05" />
                  <path d="M12,6.38c1.25,0 2.37,0.43 3.25,1.27l2.44,-2.44C16.22,3.84 14.3,3.08 12,3.08C8.49,3.08 5.47,5.08 4,8L7.4,10.66c0.77,-2.33 2.94,-4.28 5.5,-4.28z" fill="#EA4335" />
                </g>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="mt-5 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage('');
              }}
              disabled={isLoading}
              className="text-xs text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              {isRegister 
                ? 'Already have credentials? Sign In here' 
                : 'First-time explorer? Create an account here'}
            </button>
          </div>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
            <span className="relative bg-[#0d0910] px-3.5 text-[9px] text-text-muted font-mono uppercase font-bold tracking-wider">Or</span>
          </div>

          {/* Continue as Guest */}
          <button
            onClick={handleGuestMode}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Globe className="h-4 w-4 text-text-muted" /> Continue in Guest (Offline) Mode
          </button>
        </GlassCard>
      </motion.div>
    </div>
  );
}
