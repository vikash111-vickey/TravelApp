'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Camera, Compass, Rotate3d, Play, RefreshCw, Zap } from 'lucide-react';
import GlassCard from './GlassCard';

interface ARViewProps {
  destinationName: string;
}

export default function ARView({ destinationName }: ARViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelType, setModelType] = useState<'stupa' | 'shikhara' | 'arch'>('stupa');
  const [isScanning, setIsScanning] = useState(true);
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.5 });
  const [scale, setScale] = useState(1.0);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Render Loop for Custom 3D wireframe Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let localYRotation = rotation.y;

    // Generate 3D points based on the model selection
    const generatePoints = () => {
      const points: Array<[number, number, number]> = [];
      const lines: Array<[number, number]> = [];

      if (modelType === 'stupa') {
        // Buddhist Stupa / Dome Shape
        // Base rings
        for (let r = 0; r < 3; r++) {
          const radius = 60 - r * 8;
          const y = 50 - r * 12;
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            points.push([Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
            if (i > 0) lines.push([points.length - 1, points.length - 2]);
            lines.push([points.length - 1, points.length - 1 - 15]); // close ring
          }
        }
        // Dome section
        const domeStart = points.length;
        for (let ring = 0; ring < 6; ring++) {
          const lat = (ring / 6) * (Math.PI / 2);
          const radius = Math.cos(lat) * 45;
          const y = -10 - Math.sin(lat) * 45;
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            points.push([Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
            // Connect latitude
            if (i > 0) lines.push([points.length - 1, points.length - 2]);
            lines.push([points.length - 1, points.length - 1 - 15]);
            // Connect longitude
            if (ring > 0) {
              lines.push([points.length - 1, points.length - 1 - 16]);
            }
          }
        }
        // Spire top
        const spireIndex = points.length;
        points.push([0, -85, 0]); // Spire Tip
        for (let i = 0; i < 16; i++) {
          // Connect top dome ring to spire
          lines.push([spireIndex, spireIndex - 1 - i]);
        }
      } else if (modelType === 'shikhara') {
        // Temple Tower spire (pyramidal shikhara)
        for (let h = 0; h < 6; h++) {
          const w = 55 * Math.pow(0.7, h);
          const y = 60 - h * 25;
          const startIdx = points.length;
          points.push([-w, y, -w]); // FL
          points.push([w, y, -w]);  // FR
          points.push([w, y, w]);   // BR
          points.push([-w, y, w]);  // BL

          lines.push([startIdx, startIdx + 1]);
          lines.push([startIdx + 1, startIdx + 2]);
          lines.push([startIdx + 2, startIdx + 3]);
          lines.push([startIdx + 3, startIdx]);

          if (h > 0) {
            lines.push([startIdx, startIdx - 4]);
            lines.push([startIdx + 1, startIdx - 3]);
            lines.push([startIdx + 2, startIdx - 2]);
            lines.push([startIdx + 3, startIdx - 1]);
          }
        }
        const tipIdx = points.length;
        points.push([0, -90, 0]);
        lines.push([tipIdx, tipIdx - 4]);
        lines.push([tipIdx, tipIdx - 3]);
        lines.push([tipIdx, tipIdx - 2]);
        lines.push([tipIdx, tipIdx - 1]);
      } else {
        // Heritage Arch (Portuguese/Mughal Gate)
        for (let r = 0; r < 2; r++) {
          const z = r === 0 ? -15 : 15;
          const startIdx = points.length;
          // Left pillar
          points.push([-40, 60, z]);
          points.push([-40, -10, z]);
          points.push([-25, -10, z]);
          points.push([-25, 60, z]);
          // Right pillar
          points.push([25, 60, z]);
          points.push([25, -10, z]);
          points.push([40, -10, z]);
          points.push([40, 60, z]);

          // Arch points
          for (let i = 0; i <= 8; i++) {
            const angle = Math.PI - (i / 8) * Math.PI;
            const radius = 32.5;
            points.push([Math.cos(angle) * radius, -10 - Math.sin(angle) * 20, z]);
          }

          // Connect pillar lines
          lines.push([startIdx, startIdx + 1]);
          lines.push([startIdx + 1, startIdx + 2]);
          lines.push([startIdx + 2, startIdx + 3]);
          lines.push([startIdx + 3, startIdx]);

          lines.push([startIdx + 4, startIdx + 5]);
          lines.push([startIdx + 5, startIdx + 6]);
          lines.push([startIdx + 6, startIdx + 7]);
          lines.push([startIdx + 7, startIdx + 4]);

          // Connect Arch segments
          const archStart = startIdx + 8;
          for (let i = 0; i < 8; i++) {
            lines.push([archStart + i, archStart + i + 1]);
          }

          // Cross connects between front and back arches if r is 1
          if (r === 1) {
            const halfCount = points.length / 2;
            for (let i = 0; i < halfCount; i++) {
              if (i % 2 === 0 || i > 7) {
                lines.push([i, i + halfCount]);
              }
            }
          }
        }
      }

      return { points, lines };
    };

    const { points, lines } = generatePoints();
    let scanY = 0;
    let scanDirection = 1;

    const render = () => {
      // Handle resizing if container width changes
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 20;

      // Project 3D points to 2D
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const cosY = Math.cos(localYRotation);
      const sinY = Math.sin(localYRotation);

      const projected: Array<{ x: number; y: number; z: number }> = points.map(([x, y, z]) => {
        // Rotate Y
        let nx = x * cosY - z * sinY;
        let nz = x * sinY + z * cosY;

        // Rotate X
        let ny = y * cosX - nz * sinX;
        let finalZ = y * sinX + nz * cosX;

        // Perspective projection
        const fov = 350;
        const distance = 300;
        const scaleFactor = (fov / (distance + finalZ)) * scale;
        return {
          x: cx + nx * scaleFactor,
          y: cy + ny * scaleFactor,
          z: finalZ
        };
      });

      // Draw Grid Base (Mock Scanner boundary)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++) {
        // Draw grid lines
        const gX1 = cx + i * 35;
        const gY1 = cy + 60;
        ctx.beginPath();
        ctx.moveTo(gX1 - 30, gY1 + 15);
        ctx.lineTo(gX1 + 30, gY1 - 15);
        ctx.stroke();
      }

      // Sort lines by depth for a cleaner wireframe render
      lines.forEach(([p1, p2]) => {
        const pt1 = projected[p1];
        const pt2 = projected[p2];
        if (!pt1 || !pt2) return;

        // Gradient based on depth
        const avgZ = (pt1.z + pt2.z) / 2;
        const alpha = Math.max(0.1, 0.7 - (avgZ + 100) / 300);

        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);

        // Core visual style
        if (modelType === 'stupa') {
          ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`; // Saffron Glow
        } else if (modelType === 'shikhara') {
          ctx.strokeStyle = `rgba(136, 19, 55, ${alpha})`; // Velvet Rose Glow
        } else {
          ctx.strokeStyle = `rgba(5, 150, 105, ${alpha})`; // Emerald Arch
        }

        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Floating scanning beam
      if (isScanning) {
        scanY += 1.5 * scanDirection;
        if (scanY > 120 || scanY < -120) {
          scanDirection *= -1;
        }

        // Draw horizontal scanning laser plane
        const laserY = cy + scanY;
        ctx.beginPath();
        ctx.moveTo(cx - 150, laserY);
        ctx.lineTo(cx + 150, laserY);
        const scanGlow = ctx.createLinearGradient(cx - 150, 0, cx + 150, 0);
        scanGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
        scanGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
        scanGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = scanGlow;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Holographic noise text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.font = '10px monospace';
        ctx.fillText(`BEAM SCANNING TARGET: ${destinationName.toUpperCase()}_MODEL`, 25, 30);
      }

      // Rotate over time if not dragging
      if (!isDragging.current) {
        localYRotation += 0.006;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [modelType, isScanning, rotation, scale, destinationName]);

  // Mouse drag handles
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    setRotation(prev => ({
      x: Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev.x + deltaY * 0.01)),
      y: prev.y + deltaX * 0.01
    }));

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full max-w-6xl mx-auto my-6">
      
      {/* 3D AR Screen */}
      <GlassCard glowColor="white" className="lg:col-span-2 relative p-4 h-[350px] md:h-[450px] overflow-hidden flex flex-col items-center justify-center">
        {/* AR Telemetry Overlay */}
        <div className="absolute top-4 left-4 z-10 font-mono text-[10px] text-text-muted space-y-1.5 pointer-events-none">
          <p className="flex items-center gap-1.5 text-white">
            <Camera className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
            WanderLens WebAR HUD v1.2
          </p>
          <p>AZIMUTH: {Math.round((rotation.y * 180) / Math.PI) % 360}°</p>
          <p>ELEVATION: {Math.round((rotation.x * 180) / Math.PI)}°</p>
          <p>SCALE: {(scale * 100).toFixed(0)}%</p>
        </div>

        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`px-3 py-1 text-[10px] font-mono font-semibold rounded-full border transition-colors flex items-center gap-1 ${
              isScanning 
                ? 'bg-velvet-rose/25 text-white border-velvet-rose/40' 
                : 'bg-white/5 text-text-muted border-white/10'
            }`}
          >
            <Zap className="h-3 w-3 text-saffron-radiance" />
            {isScanning ? 'SCAN ON' : 'SCAN OFF'}
          </button>
        </div>

        {/* 3D Render Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full cursor-grab active:cursor-grabbing bg-black/45 rounded-xl border border-white/5"
        />

        {/* HUD Overlay controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-midnight-obsidian/80 px-4 py-2 rounded-full border border-white/10 text-xs">
          <button 
            onClick={() => setScale(s => Math.max(0.6, s - 0.1))}
            className="p-1 hover:text-white"
          >
            -
          </button>
          <span className="font-mono text-text-muted">Scale</span>
          <button 
            onClick={() => setScale(s => Math.min(1.4, s + 0.1))}
            className="p-1 hover:text-white"
          >
            +
          </button>
        </div>
      </GlassCard>

      {/* Model Controls Card */}
      <GlassCard className="flex flex-col justify-between">
        <div>
          <span className="text-xs text-saffron-radiance font-semibold uppercase tracking-wider flex items-center gap-1">
            <Compass className="h-3 w-3 animate-spin-slow" />
            Virtual Landmark Preview
          </span>
          <h3 className="text-xl font-bold font-display text-white mt-1">Interactive AR Scan</h3>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            Drag mouse across the viewer card to manually pivot the spatial coordinate grid. WanderLens WebAR renders structural geometries for landmarks.
          </p>

          <div className="mt-6 space-y-3">
            <label className="text-xs text-white font-semibold">Select Architectural Preset</label>
            <div className="flex flex-col gap-2">
              {[
                { id: 'stupa', label: 'Buddhist Stupa (Himalayan Stupa)', desc: 'Spherical core & pointed spire' },
                { id: 'shikhara', label: 'Temple Shikhara (North Indian Dome)', desc: 'Pyramidal spire with layered sections' },
                { id: 'arch', label: 'Portuguese Heritage Archway', desc: 'Symmetrical twin pillars & curved dome' }
              ].map((model) => (
                <button
                  key={model.id}
                  onClick={() => setModelType(model.id as any)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    modelType === model.id
                      ? 'bg-velvet-rose/15 border-velvet-rose text-white'
                      : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{model.label}</span>
                    <Rotate3d className="h-3.5 w-3.5 opacity-65" />
                  </div>
                  <p className="text-[10px] opacity-75 mt-0.5">{model.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-[11px] text-text-muted">
          <span>Simulation target: {destinationName}</span>
          <button 
            onClick={() => {
              setRotation({ x: 0.5, y: 0.5 });
              setScale(1.0);
            }} 
            className="flex items-center gap-1 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" /> Reset View
          </button>
        </div>
      </GlassCard>

    </div>
  );
}
