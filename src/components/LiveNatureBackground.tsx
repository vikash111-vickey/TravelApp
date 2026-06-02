'use client';

import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export default function LiveNatureBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate organic particles (drifting embers/fireflies)
    const items = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // starting horizontal percent
      y: Math.random() * 80 + 20, // starting vertical position (concentrated below screen top)
      size: Math.random() * 3 + 1.5, // 1.5px to 4.5px
      delay: Math.random() * -15, // negative delay so they start drifting immediately!
      duration: Math.random() * 20 + 15 // slow drift speed: 15s to 35s
    }));
    setParticles(items);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      
      {/* Nature Silhouette Layers: Distant Hills & Pine silhouettes */}
      <div className="absolute bottom-0 left-0 right-0 h-44 opacity-25 z-0">
        
        {/* Layer 1: Mountain range */}
        <svg 
          viewBox="0 0 1440 320" 
          className="absolute bottom-0 w-full h-[120%] text-red-950/20 fill-current" 
          preserveAspectRatio="none"
        >
          <path d="M0,224L120,208C240,192,480,160,720,160C960,160,1200,192,1320,208L1440,224L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"></path>
        </svg>

        {/* Layer 2: Detailed foreground ridge */}
        <svg 
          viewBox="0 0 1440 320" 
          className="absolute bottom-0 w-full h-[90%] text-red-900/10 fill-current" 
          preserveAspectRatio="none"
        >
          <path d="M0,256L60,245.3C120,235,240,213,360,208C480,203,600,213,720,224C840,235,960,245,1080,234.7C1200,224,1320,192,1380,176L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
        
      </div>

      {/* Floating Crimson Forest Embers */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-gradient-to-tr from-velvet-rose to-saffron-radiance blur-[0.7px] animate-float shadow-inner"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
      
      {/* Subtle overlay fog/mist */}
      <div className="absolute inset-0 bg-gradient-to-t from-midnight-obsidian/30 via-transparent to-transparent opacity-80" />
      
    </div>
  );
}
