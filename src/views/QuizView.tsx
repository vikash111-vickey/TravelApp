'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Sun, Compass, Coffee, MapPin, Leaf, Train, Bike, Car, Users, Zap, Flame, ChefHat, Utensils, Grape, Heart, Shield, Award, Camera, Flower, CheckCircle, RefreshCw } from 'lucide-react';
import { QUIZ_QUESTIONS, ARCHETYPES, Archetype } from '../data/mockData';
import GlassCard from '../components/GlassCard';
import confetti from 'canvas-confetti';

// Map icon strings to Lucide components
const iconMap: Record<string, React.ComponentType<any>> = {
  Sun, Compass, Coffee, MapPin, Leaf, Train, Bike, Car, Users, Zap, Flame, ChefHat, Utensils, Grape, Heart, Shield, Award, Camera, Flower
};

interface QuizViewProps {
  setActiveView: (view: string) => void;
  setUserArchetype: (archetype: string) => void;
  user: any;
  dbObj: any;
  onProfileSync?: () => void;
}

export default function QuizView({ setActiveView, setUserArchetype, user, dbObj, onProfileSync }: QuizViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<Archetype | null>(null);

  const handleSelectOption = async (archetype: string) => {
    const nextAnswers = [...answers, archetype];
    setAnswers(nextAnswers);

    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate majority archetype
      const counts: Record<string, number> = {};
      let maxCount = 0;
      let winningArchetype = 'value'; // Fallback

      nextAnswers.forEach((a) => {
        counts[a] = (counts[a] || 0) + 1;
        if (counts[a] > maxCount) {
          maxCount = counts[a];
          winningArchetype = a;
        }
      });

      const chosen = ARCHETYPES[winningArchetype];
      setResult(chosen);
      setUserArchetype(winningArchetype);

      // Persist results to Firestore / Mock Database
      if (dbObj && user) {
        try {
          await dbObj.collection('users').doc(user.uid).set({
            persona: winningArchetype
          }, { merge: true });
          
          // Also set in localStorage for quick load
          localStorage.setItem(`gobro_${user.uid}_user_persona`, winningArchetype);
          if (onProfileSync) onProfileSync();
        } catch (e) {
          console.error("Failed to persist quiz archetype results:", e);
        }
      } else {
        if (onProfileSync) onProfileSync();
      }

      // Trigger Celebration Confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers([]);
    setResult(null);
  };

  const progressPercentage = ((currentStep) / QUIZ_QUESTIONS.length) * 100;
  const activeQuestion = QUIZ_QUESTIONS[currentStep];

  return (
    <div className="relative w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
      
      <AnimatePresence mode="wait">
        {!result ? (
          /* Quiz Question Layout */
          <motion.div
            key="quiz-question"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full flex flex-col items-center"
          >
            {/* Header Telemetry */}
            <div className="w-full max-w-xl flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-saffron-radiance uppercase">AI Persona Profiler</span>
                <h2 className="text-sm font-semibold text-white">Step {currentStep + 1} of {QUIZ_QUESTIONS.length}</h2>
              </div>
              
              {/* Radial Progress Ring */}
              <div className="relative h-10 w-10 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    className="stroke-white/5 fill-none"
                    strokeWidth="3.5"
                  />
                  <motion.circle
                    cx="20"
                    cy="20"
                    r="16"
                    className="stroke-saffron-radiance fill-none"
                    strokeWidth="3.5"
                    strokeDasharray={100}
                    strokeDashoffset={100 - progressPercentage}
                    transition={{ duration: 0.4 }}
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-white font-mono">{Math.round(progressPercentage)}%</span>
              </div>
            </div>

            {/* Question title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-center text-white max-w-2xl leading-snug mb-10">
              {activeQuestion.question}
            </h1>

            {/* Question options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              {activeQuestion.options.map((opt, idx) => {
                const IconComponent = iconMap[opt.icon] || Compass;
                return (
                  <GlassCard
                    key={idx}
                    onClick={() => handleSelectOption(opt.archetype)}
                    glowColor="rose"
                    className="p-5 flex items-start gap-4 text-left border border-white/5 bg-white/2 hover:bg-white/5 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-saffron-radiance group-hover:bg-velvet-rose group-hover:text-white transition-colors flex-shrink-0">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-white leading-snug transition-colors">
                        {opt.text}
                      </p>
                      <span className="text-[9px] text-text-muted mt-1.5 block font-mono uppercase tracking-wider">
                        Selection {idx + 1}
                      </span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            <button
              onClick={() => setActiveView('home')}
              className="mt-8 text-xs text-text-muted hover:text-white hover:underline transition-colors"
            >
              Skip and view generic recommendations
            </button>
          </motion.div>
        ) : (
          /* Quiz Results Layout */
          <motion.div
            key="quiz-result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-xl text-center flex flex-col items-center"
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mb-6 shadow-lg shadow-green-500/5"
            >
              <CheckCircle className="h-8 w-8" />
            </motion.div>

            <span className="text-xs text-saffron-radiance font-mono tracking-widest uppercase">Persona Profile Discovered</span>
            
            {/* Visual Archetype Banner */}
            <div className={`mt-4 w-full p-8 rounded-3xl bg-gradient-to-br ${result.bgGradient} border border-white/10 shadow-2xl relative overflow-hidden text-left text-white`}>
              <div className="absolute right-4 top-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
                {result.badge}
              </div>
              <h3 className="font-display font-black text-2xl tracking-wide">{result.name}</h3>
              <p className="text-xs text-white/90 mt-2 font-medium tracking-wide italic">
                "{result.tagline}"
              </p>
              <p className="text-xs text-white/80 mt-4 leading-relaxed font-sans border-t border-white/10 pt-4">
                {result.description}
              </p>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => setActiveView('discover')}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider shadow-lg hover:scale-102 active:scale-98 transition-transform flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
                Personalize Explore Grid
              </button>
              
              <button
                onClick={resetQuiz}
                className="py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-xs tracking-wider hover:bg-white/10 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                Retake Quiz
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
