'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: string; // e.g., 'rose', 'saffron', 'emerald'
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  hoverEffect = true,
  glowColor = 'rose',
  onClick
}: GlassCardProps) {
  const glowShadows: Record<string, string> = {
    rose: 'hover:shadow-[0_0_30px_rgba(136,19,55,0.25)] hover:border-velvet-rose/40',
    saffron: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:border-saffron-radiance/40',
    emerald: 'hover:shadow-[0_0_30px_rgba(5,150,105,0.2)] hover:border-green-oasis/40',
    white: 'hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:border-white/20'
  };

  const selectedGlow = glowShadows[glowColor] || glowShadows.rose;

  return (
    <motion.div
      onClick={onClick}
      className={`
        glassmorphism rounded-2xl p-6 transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${hoverEffect ? `hover:-translate-y-1.5 ${selectedGlow}` : ''}
        ${className}
      `}
      whileHover={hoverEffect ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
