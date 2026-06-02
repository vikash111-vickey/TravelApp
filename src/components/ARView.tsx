'use client';

import React, { useRef, useEffect, useState } from 'react';
import { 
  Camera, 
  Compass, 
  Rotate3d, 
  RefreshCw, 
  Zap, 
  Loader2, 
  ShieldAlert, 
  CheckCircle, 
  Download, 
  Plus, 
  Heart, 
  Smartphone, 
  AlertTriangle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  BookOpen,
  Calendar,
  Share2,
  FileText,
  Activity,
  Layers
} from 'lucide-react';
import GlassCard from './GlassCard';
import { calculateDistanceKm, getBearingDirection } from '../utils/geosearch';

interface ARViewProps {
  destinationName: string;
  userLocation?: {
    lat: number;
    lng: number;
    city: string;
    accuracy: number;
    status: 'enabled' | 'denied' | 'prompt' | 'fetching';
  } | null;
  showToast?: (message: string, type?: string) => void;
}

interface Landmark {
  id: string;
  name: string;
  category: 'monument' | 'restaurant' | 'shopping' | 'offbeat';
  lat: number;
  lng: number;
  distance?: number;
  bearing?: number;
}

interface MemoryCapsule {
  id: string;
  name: string;
  story: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  timestamp: string;
}

// Generate diverse landmarks around the coordinates
const getCachedLandmarks = (destName: string, lat: number, lng: number): Landmark[] => {
  if (typeof window === 'undefined') return [];
  const cacheKey = `gobro_ar_landmarks_${destName.toLowerCase().replace(/\s+/g, '-')}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  const landmarks: Landmark[] = [
    {
      id: 'lm1',
      name: 'Ancient Heritage Gate',
      category: 'monument',
      lat: lat + 0.0045, 
      lng: lng + 0.0021  
    },
    {
      id: 'lm2',
      name: 'Local Bazaars & Spices',
      category: 'shopping',
      lat: lat - 0.0031, 
      lng: lng - 0.0045  
    },
    {
      id: 'lm3',
      name: 'Spiritual Temple Shrine',
      category: 'monument',
      lat: lat + 0.0120, 
      lng: lng - 0.0080
    },
    {
      id: 'lm4',
      name: 'The Secret Spice Cafe',
      category: 'restaurant',
      lat: lat - 0.0015, 
      lng: lng + 0.0035
    },
    {
      id: 'lm5',
      name: 'Hidden Waterfall Trail',
      category: 'offbeat',
      lat: lat + 0.0250, 
      lng: lng + 0.0180
    },
    {
      id: 'lm6',
      name: 'Mountain View Summit',
      category: 'offbeat',
      lat: lat - 0.0320, 
      lng: lng - 0.0210
    },
    {
      id: 'lm7',
      name: 'Street Food Haven',
      category: 'restaurant',
      lat: lat + 0.0008, 
      lng: lng - 0.0012
    },
    {
      id: 'lm8',
      name: 'Royal Heritage Palace',
      category: 'monument',
      lat: lat + 0.0180, 
      lng: lng + 0.0220
    }
  ];

  localStorage.setItem(cacheKey, JSON.stringify(landmarks));
  return landmarks;
};

export default function ARView({ destinationName, userLocation, showToast }: ARViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);

  // References for WebGL Scene Control
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ x: 45, y: 35, radius: 80 }); // theta, phi, radius

  // Mode toggles
  const [arMode, setArMode] = useState<'ar' | 'radar' | 'twin'>('twin');
  const [timelineState, setTimelineState] = useState<'past' | 'present' | 'future'>('present');
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [droneActive, setDroneActive] = useState(false);

  // Live dashboard variables
  const [dashboardOpen, setDashboardOpen] = useState(false);
  
  // Audio Narrator states
  const [audioNarrating, setAudioNarrating] = useState(false);
  
  // Memory Capsule states
  const [capsules, setCapsules] = useState<MemoryCapsule[]>([]);
  const [selectedCapsule, setSelectedCapsule] = useState<MemoryCapsule | null>(null);
  const [showCapsuleForm, setShowCapsuleForm] = useState(false);
  const [newCapsuleName, setNewCapsuleName] = useState('');
  const [newCapsuleStory, setNewCapsuleStory] = useState('');
  
  // Permission statuses
  const [cameraStatus, setCameraStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [sensorStatus, setSensorStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  
  // HUD orientation state
  const [heading, setHeading] = useState(0); 
  const [pitch, setPitch] = useState(75); 
  const [roll, setRoll] = useState(0);

  const [activeLandmarks, setActiveLandmarks] = useState<Landmark[]>([]);
  const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);
  const [activePillar, setActivePillar] = useState<any | null>(null);

  // Dynamic values based on current time ticks
  const [simulatedSpeed, setSimulatedSpeed] = useState(0);
  const [simulatedAltitude, setSimulatedAltitude] = useState(0);

  // Load Three.js and Tween.js dynamically on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if ((window as any).THREE && (window as any).TWEEN) {
      setThreeLoaded(true);
      return;
    }

    const loadScripts = async () => {
      const loadScript = (src: string) => {
        return new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => reject();
          document.head.appendChild(script);
        });
      };

      try {
        if (!(window as any).THREE) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        }
        if (!(window as any).TWEEN) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js');
        }
        setThreeLoaded(true);
      } catch (err) {
        console.error("Failed to load Three.js or Tween.js:", err);
      }
    };

    loadScripts();
  }, []);

  // Set up center coordinates
  const getCenterCoordinates = () => {
    const centerLat = userLocation && userLocation.status === 'enabled' ? userLocation.lat : 12.9716;
    const centerLng = userLocation && userLocation.status === 'enabled' ? userLocation.lng : 77.5946;
    
    let targetLat = centerLat;
    let targetLng = centerLng;

    if (!userLocation || userLocation.city.toLowerCase() !== destinationName.toLowerCase()) {
      let hash = 0;
      for (let i = 0; i < destinationName.length; i++) {
        hash = destinationName.charCodeAt(i) + ((hash << 5) - hash);
      }
      hash = Math.abs(hash);
      targetLat = 8.4 + ((hash % 1000) / 1000) * 24.6;
      targetLng = 68.7 + ((hash % 1000) / 1000) * 23.3;
    }
    return { lat: targetLat, lng: targetLng };
  };

  // Compute landmarks based on coordinates on mount or location shift
  useEffect(() => {
    const { lat: targetLat, lng: targetLng } = getCenterCoordinates();
    const raw = getCachedLandmarks(destinationName, targetLat, targetLng);
    
    const computed = raw.map(lm => {
      const dLat = (lm.lat - targetLat) * Math.PI / 180;
      const dLng = (lm.lng - targetLng) * Math.PI / 180;
      const rLat1 = targetLat * Math.PI / 180;
      const rLat2 = lm.lat * Math.PI / 180;

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(rLat1) * Math.cos(rLat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371000 * c; 

      const y = Math.sin(dLng) * Math.cos(rLat2);
      const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLng);
      const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

      return { ...lm, distance, bearing };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));

    setActiveLandmarks(computed);

    // Populate default capsules
    setCapsules([
      {
        id: 'cap1',
        name: 'Grandmothers Gold Log',
        story: `Spiritual family heirloom capsule buried near the central gates of ${destinationName}. Legend says a hidden treasure chart and old letters are inside.`,
        lat: targetLat + 0.005,
        lng: targetLng - 0.004,
        timestamp: '1974-08-12'
      },
      {
        id: 'cap2',
        name: 'Monsoon Floods Log 2011',
        story: `Contains photography records and diary entries documenting the historic monsoon rising water levels in ${destinationName}. Sealed until 2031.`,
        lat: targetLat - 0.006,
        lng: targetLng + 0.008,
        timestamp: '2011-09-02'
      }
    ]);
  }, [destinationName, userLocation]);

  // Request camera and sensor orientation
  const startCamera = async () => {
    try {
      setCameraStatus('prompt');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus('granted');
    } catch (e) {
      console.error('Camera capture block:', e);
      setCameraStatus('denied');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleOrientation = (e: DeviceOrientationEvent) => {
    // @ts-ignore
    let compass = e.webkitCompassHeading || e.alpha || 0;
    // @ts-ignore
    if (!e.webkitCompassHeading && e.alpha !== null) {
      compass = 360 - e.alpha;
    }
    setHeading(compass);
    if (e.beta !== null) setPitch(e.beta);
    if (e.gamma !== null) setRoll(e.gamma);
  };

  const requestOrientationPermission = async () => {
    if (
      typeof window !== 'undefined' &&
      typeof DeviceOrientationEvent !== 'undefined' &&
      // @ts-ignore
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        // @ts-ignore
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          setSensorStatus('granted');
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setSensorStatus('denied');
        }
      } catch (e) {
        console.error('iOS device orientation permission error:', e);
        setSensorStatus('denied');
      }
    } else {
      if (typeof window !== 'undefined' && 'ondeviceorientation' in window) {
        setSensorStatus('granted');
        window.addEventListener('deviceorientation', handleOrientation);
      } else {
        setSensorStatus('unsupported');
      }
    }
  };

  // Manage streams on mode switch
  useEffect(() => {
    if (arMode === 'ar') {
      startCamera();
      requestOrientationPermission();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [arMode]);

  // Orientation fallback compass rotation drift if no sensors
  useEffect(() => {
    if (sensorStatus !== 'granted' && arMode !== 'twin') {
      const interval = setInterval(() => {
        setHeading(h => (h + 0.4) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [sensorStatus, arMode]);

  // Renders Circular Radar sweep
  useEffect(() => {
    if (arMode !== 'radar') return;
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepAngle = 0;

    const renderRadar = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(cx, cy) - 30;

      ctx.clearRect(0, 0, w, h);

      // Radar rings base grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      const rings = [0.25, 0.5, 0.75, 1];
      rings.forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius * r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${(r * 5).toFixed(1)} km`, cx + 5, cy - maxRadius * r + 10);
      });

      // Axis lines
      ctx.beginPath();
      ctx.moveTo(cx - maxRadius, cy);
      ctx.lineTo(cx + maxRadius, cy);
      ctx.moveTo(cx, cy - maxRadius);
      ctx.lineTo(cx, cy + maxRadius);
      ctx.stroke();

      // Cardinal Labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', cx, cy - maxRadius - 12);
      ctx.fillText('S', cx, cy + maxRadius + 12);
      ctx.fillText('E', cx + maxRadius + 12, cy);
      ctx.fillText('W', cx - maxRadius - 12, cy);

      // Animated Sweep Line
      sweepAngle = (sweepAngle + 1.2) % 360;
      const sweepRad = (sweepAngle * Math.PI) / 180;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.1)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, sweepRad - 0.2, sweepRad, false);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepRad) * maxRadius, cy + Math.sin(sweepRad) * maxRadius);
      ctx.stroke();

      // Plot landmarks dots
      activeLandmarks.forEach(lm => {
        const bearingRad = ((lm.bearing || 0) - 90) * Math.PI / 180;
        const distRatio = Math.min(1, (lm.distance || 1000) / 5000);
        const lmRadius = maxRadius * distRatio;

        const lmX = cx + Math.cos(bearingRad) * lmRadius;
        const lmY = cy + Math.sin(bearingRad) * lmRadius;

        const angleDiff = Math.abs((lm.bearing || 0) - sweepAngle) % 360;
        const isSwept = angleDiff < 15 || angleDiff > 345;

        let dotColor = 'rgba(245, 158, 11, 0.4)';
        let activeColor = 'rgba(245, 158, 11, 0.9)';
        if (lm.category === 'restaurant') {
          dotColor = 'rgba(219, 39, 119, 0.4)';
          activeColor = 'rgba(219, 39, 119, 0.9)';
        } else if (lm.category === 'shopping') {
          dotColor = 'rgba(14, 165, 233, 0.4)';
          activeColor = 'rgba(14, 165, 233, 0.9)';
        } else if (lm.category === 'offbeat') {
          dotColor = 'rgba(16, 185, 129, 0.4)';
          activeColor = 'rgba(16, 185, 129, 0.9)';
        }

        ctx.fillStyle = isSwept ? activeColor : dotColor;
        ctx.beginPath();
        ctx.arc(lmX, lmY, isSwept ? 5.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        if (activeLandmark?.id === lm.id) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(lmX, lmY, 7.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(renderRadar);
    };

    renderRadar();
    return () => cancelAnimationFrame(animId);
  }, [arMode, activeLandmarks, activeLandmark]);

  // Renders camera overlays HUD
  useEffect(() => {
    if (arMode !== 'ar' || cameraStatus !== 'granted') return;
    const canvas = arCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderAR = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Center crosshair overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 22, cy);
      ctx.lineTo(cx - 8, cy);
      ctx.moveTo(cx + 8, cy);
      ctx.lineTo(cx + 22, cy);
      ctx.moveTo(cx, cy - 22);
      ctx.lineTo(cx, cy - 8);
      ctx.moveTo(cx, cy + 8);
      ctx.lineTo(cx, cy + 22);
      ctx.stroke();

      const fov = 50; 
      let centerAlignedLandmark: Landmark | null = null;
      let minCenterOffset = 5.5;

      activeLandmarks.forEach(lm => {
        let relBearing = (lm.bearing || 0) - heading;
        if (relBearing > 180) relBearing -= 360;
        if (relBearing < -180) relBearing += 360;

        if (Math.abs(relBearing) < fov / 2) {
          const screenX = cx + (relBearing / (fov / 2)) * (w / 2);
          const targetPitch = 75;
          const pitchOffset = (pitch - targetPitch) * 4.5;
          const screenY = cy - pitchOffset;

          if (screenX > 0 && screenX < w && screenY > 0 && screenY < h) {
            let color = '#f59e0b';
            if (lm.category === 'restaurant') color = '#db2777';
            else if (lm.category === 'shopping') color = '#0ea5e9';
            else if (lm.category === 'offbeat') color = '#10b981';

            ctx.strokeStyle = `${color}55`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX, h - 25);
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 8.5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9.5px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(lm.name.toUpperCase(), screenX, screenY - 24);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.font = '8px monospace';
            ctx.fillText(`${lm.category.toUpperCase()} • ${(lm.distance || 0).toFixed(0)}m`, screenX, screenY - 12);

            const distanceToCenter = Math.abs(relBearing);
            if (distanceToCenter < minCenterOffset) {
              minCenterOffset = distanceToCenter;
              centerAlignedLandmark = lm;
            }
          }
        } else {
          const side = relBearing > 0 ? 'right' : 'left';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          if (side === 'right') {
            ctx.moveTo(w - 18, cy - 8);
            ctx.lineTo(w - 4, cy);
            ctx.lineTo(w - 18, cy + 8);
          } else {
            ctx.moveTo(18, cy - 8);
            ctx.lineTo(4, cy);
            ctx.lineTo(18, cy + 8);
          }
          ctx.fill();
        }
      });

      if (centerAlignedLandmark) {
        setActiveLandmark(centerAlignedLandmark);
        
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;

        // Focus brackets
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 30);
        ctx.lineTo(cx - 18, cy - 30);
        ctx.moveTo(cx - 30, cy - 30);
        ctx.lineTo(cx - 30, cy - 18);

        ctx.moveTo(cx + 30, cy - 30);
        ctx.lineTo(cx + 18, cy - 30);
        ctx.moveTo(cx + 30, cy - 30);
        ctx.lineTo(cx + 30, cy - 18);

        ctx.moveTo(cx - 30, cy + 30);
        ctx.lineTo(cx - 18, cy + 30);
        ctx.moveTo(cx - 30, cy + 30);
        ctx.lineTo(cx - 30, cy + 18);

        ctx.moveTo(cx + 30, cy + 30);
        ctx.lineTo(cx + 18, cy + 30);
        ctx.moveTo(cx + 30, cy + 30);
        ctx.lineTo(cx + 30, cy + 18);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TARGET LOCK ACQUIRED', cx, cy + 42);
      }

      animId = requestAnimationFrame(renderAR);
    };

    renderAR();
    return () => cancelAnimationFrame(animId);
  }, [arMode, activeLandmarks, heading, pitch, roll, cameraStatus]);

  // Click on Radar Canvas to select point manually
  const handleRadarClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxRadius = Math.min(cx, cy) - 30;

    let closestLm: Landmark | null = null;
    let minDist = 22;

    activeLandmarks.forEach(lm => {
      const bearingRad = ((lm.bearing || 0) - 90) * Math.PI / 180;
      const distRatio = Math.min(1, (lm.distance || 1000) / 5000);
      const lmRadius = maxRadius * distRatio;

      const lmX = cx + Math.cos(bearingRad) * lmRadius;
      const lmY = cy + Math.sin(bearingRad) * lmRadius;

      const clickDist = Math.hypot(x - lmX, y - lmY);
      if (clickDist < minDist) {
        minDist = clickDist;
        closestLm = lm;
      }
    });

    if (closestLm) {
      setActiveLandmark(closestLm);
    }
  };

  // Three.js Digital Twin World Engine Setup
  const initThreeTwin = () => {
    const THREE = (window as any).THREE;
    const TWEEN = (window as any).TWEEN;
    if (!THREE || !threeContainerRef.current) return;

    // Clean up existing renderer first
    cleanupThree();

    const width = threeContainerRef.current.clientWidth;
    const height = threeContainerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08080a);
    scene.fog = new THREE.FogExp2(0x08080a, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 50, 75);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(30, 60, 30);
    scene.add(dirLight);

    const primaryGlow = new THREE.PointLight(0xec4899, 1.5, 120);
    primaryGlow.position.set(0, 15, 0);
    scene.add(primaryGlow);

    // Central core beacon
    const beaconGeo = new THREE.CylinderGeometry(0.1, 2.5, 40, 4, 1, true);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
      side: THREE.DoubleSide
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 20;
    scene.add(beacon);

    // Ground grids
    const gridHelper = new THREE.GridHelper(240, 60, 0xec4899, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Deterministic random building blocks using hashing
    const buildings: any[] = [];
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    let buildSeed = 101;
    const pseudoRand = () => {
      const x = Math.sin(buildSeed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 30; i++) {
      const bHeight = 8 + pseudoRand() * 22;
      const bWidth = 5 + pseudoRand() * 7;
      const bDepth = 5 + pseudoRand() * 7;
      
      const x = (pseudoRand() - 0.5) * 170;
      const z = (pseudoRand() - 0.5) * 170;
      
      if (Math.hypot(x, z) < 18) continue; 

      const isPlanned = pseudoRand() > 0.72; 
      const matColor = isPlanned ? 0x06b6d4 : 0x1e293b;

      const mat = new THREE.MeshPhongMaterial({
        color: matColor,
        emissive: isPlanned ? 0x06b6d4 : 0x0a0f1d,
        emissiveIntensity: isPlanned ? 0.4 : 0.1,
        transparent: true,
        opacity: isPlanned ? 0.0 : 0.8, // hidden by default unless future is active
        wireframe: isPlanned
      });

      const mesh = new THREE.Mesh(buildingGeo, mat);
      mesh.scale.set(bWidth, bHeight, bDepth);
      mesh.position.set(x, bHeight / 2, z);
      scene.add(mesh);
      
      buildings.push({
        mesh,
        height: bHeight,
        isPlanned,
        originalColor: matColor
      });
    }

    // Traffic Paths (Grid lines)
    const trafficParticles: any[] = [];
    const trafficGeo = new THREE.SphereGeometry(0.35, 6, 6);
    const trafficMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });

    const paths = [
      { start: new THREE.Vector3(-90, 0.1, -15), end: new THREE.Vector3(90, 0.1, 15) },
      { start: new THREE.Vector3(-25, 0.1, 90), end: new THREE.Vector3(25, 0.1, -90) },
      { start: new THREE.Vector3(-90, 0.1, 35), end: new THREE.Vector3(90, 0.1, -35) }
    ];

    paths.forEach(p => {
      // Draw road guide wire
      const wireMat = new THREE.LineBasicMaterial({ color: 0x334155, opacity: 0.3, transparent: true });
      const points = [p.start, p.end];
      const wireGeo = new THREE.BufferGeometry().setFromPoints(points);
      const wire = new THREE.Line(wireGeo, wireMat);
      scene.add(wire);

      // Create glowing traffic elements
      for (let j = 0; j < 4; j++) {
        const item = new THREE.Mesh(trafficGeo, trafficMat.clone());
        item.position.copy(p.start);
        scene.add(item);
        
        trafficParticles.push({
          mesh: item,
          start: p.start,
          end: p.end,
          progress: j * 0.25,
          speed: 0.0035 + pseudoRand() * 0.002
        });
      }
    });

    // 3D Density Heatmap Pillars
    const pillars: any[] = [];
    const pillarGeo = new THREE.CylinderGeometry(1.4, 1.4, 1, 12);
    const { lat: centerLat, lng: centerLng } = getCenterCoordinates();

    activeLandmarks.forEach((lm) => {
      const x = (lm.lng - centerLng) * 12500;
      const z = (centerLat - lm.lat) * 12500;

      let height = 10;
      let color = 0x10b981; // Low - green
      let density = 'low';

      if (lm.category === 'monument') {
        height = 28;
        color = 0xef4444; // High - red
        density = 'high';
      } else if (lm.category === 'restaurant') {
        height = 18;
        color = 0xf97316; // Moderate - orange
        density = 'moderate';
      } else if (lm.category === 'shopping') {
        height = 15;
        color = 0x0ea5e9; // moderate market
        density = 'moderate';
      }

      const mat = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.75
      });

      const mesh = new THREE.Mesh(pillarGeo, mat);
      mesh.scale.set(1, height, 1);
      mesh.position.set(x, height / 2, z);
      scene.add(mesh);

      const light = new THREE.PointLight(color, 0.65, 16);
      light.position.set(x, height + 2, z);
      scene.add(light);

      pillars.push({
        mesh,
        height,
        color,
        light,
        landmark: lm,
        density
      });
    });

    // Floating Capsule Orbs (Time Capsules)
    const capsuleMeshes: any[] = [];
    const orbGeo = new THREE.SphereGeometry(1.3, 16, 16);

    capsules.forEach((cap) => {
      const x = (cap.lng - centerLng) * 12500;
      const z = (centerLat - cap.lat) * 12500;
      const y = 4 + pseudoRand() * 3;

      const mat = new THREE.MeshPhongMaterial({
        color: 0xa855f7, // purple memory glow
        emissive: 0xa855f7,
        emissiveIntensity: 0.75,
        transparent: true,
        opacity: 0.85
      });

      const mesh = new THREE.Mesh(orbGeo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);

      // outer rotating halo ring
      const ringGeo = new THREE.RingGeometry(1.8, 2.0, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);

      capsuleMeshes.push({
        mesh,
        capsule: cap,
        baseY: y,
        timeOffset: pseudoRand() * 200
      });
    });

    scene.userData = {
      buildings,
      trafficParticles,
      pillars,
      capsuleMeshes
    };

    // Click Raycaster Handler
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseCoord.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      
      const meshesToIntersect = [
        ...pillars.map(p => p.mesh),
        ...capsuleMeshes.map(c => c.mesh)
      ];

      const intersects = raycaster.intersectObjects(meshesToIntersect);
      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        
        // Match pillar
        const foundPillar = pillars.find(p => p.mesh === clickedMesh);
        if (foundPillar) {
          setActiveLandmark(foundPillar.landmark);
          setActivePillar(foundPillar);
          setSelectedCapsule(null);
          if (showToast) showToast(`📍 Density telemetry at ${foundPillar.landmark.name}: ${foundPillar.density.toUpperCase()}`);
          return;
        }

        // Match capsule
        const foundCapsule = capsuleMeshes.find(c => c.mesh === clickedMesh);
        if (foundCapsule) {
          setSelectedCapsule(foundCapsule.capsule);
          setActiveLandmark(null);
          setActivePillar(null);
          if (showToast) showToast(`🔮 Opened memory capsule: "${foundCapsule.capsule.name}"`);
          return;
        }
      }
    };

    renderer.domElement.addEventListener('click', onCanvasClick);

    // Apply timeline state on init
    applyTimelineState(scene, timelineState);

    // Animation Loop
    let timeTick = 0;
    const animate = () => {
      timeTick += 0.04;

      if (TWEEN) TWEEN.update();

      // Drone auto orbit kinematics
      if (droneActive && cameraRef.current) {
        cameraRotationRef.current.x += 0.18;
        cameraRotationRef.current.y = 35 + Math.sin(timeTick * 0.4) * 8;
        cameraRotationRef.current.radius = 70 + Math.cos(timeTick * 0.3) * 12;

        setSimulatedSpeed(Number((12.4 + Math.sin(timeTick) * 2.2).toFixed(1)));
        setSimulatedAltitude(Number((38.5 + Math.cos(timeTick * 0.8) * 6.5).toFixed(1)));
      }

      // Orbital updates
      if (cameraRef.current) {
        const theta = cameraRotationRef.current.x * Math.PI / 180;
        const phi = cameraRotationRef.current.y * Math.PI / 180;
        const r = cameraRotationRef.current.radius;

        cameraRef.current.position.x = r * Math.sin(theta) * Math.cos(phi);
        cameraRef.current.position.y = r * Math.sin(phi);
        cameraRef.current.position.z = r * Math.cos(theta) * Math.cos(phi);
        cameraRef.current.lookAt(0, 0, 0);
      }

      // Animate traffic movement
      trafficParticles.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
      });

      // Animate capsules hovering
      capsuleMeshes.forEach(c => {
        c.mesh.position.y = c.baseY + Math.sin(timeTick + c.timeOffset) * 0.35;
        c.mesh.rotation.y += 0.018;
      });

      // Animate pillars breathing
      pillars.forEach(p => {
        const pulse = 1 + Math.sin(timeTick * 1.8 + p.height) * 0.07;
        p.mesh.scale.set(1, p.height * pulse, 1);
        p.mesh.position.y = (p.height * pulse) / 2;
        if (p.light) {
          p.light.position.y = p.height * pulse + 1.2;
        }
      });

      // Beacon rotation
      beacon.rotation.y += 0.005;

      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const applyTimelineState = (scene: any, state: 'past' | 'present' | 'future') => {
    if (!scene) return;
    const buildings = scene.userData.buildings || [];
    const traffic = scene.userData.trafficParticles || [];

    buildings.forEach((b: any) => {
      const mat = b.mesh.material;
      if (state === 'past') {
        if (b.isPlanned) {
          b.mesh.visible = false;
        } else {
          b.mesh.visible = true;
          mat.color.setHex(0x57534e); // grayscale stone
          mat.wireframe = false;
          mat.opacity = 0.85;
        }
      } else if (state === 'present') {
        if (b.isPlanned) {
          b.mesh.visible = false;
        } else {
          b.mesh.visible = true;
          mat.color.setHex(b.originalColor);
          mat.wireframe = false;
          mat.opacity = 0.78;
        }
      } else if (state === 'future') {
        b.mesh.visible = true;
        if (b.isPlanned) {
          mat.color.setHex(0x06b6d4); // glowing cyan planned
          mat.wireframe = true;
          mat.opacity = 0.8;
        } else {
          mat.color.setHex(b.originalColor);
          mat.wireframe = false;
          mat.opacity = 0.78;
        }
      }
    });

    traffic.forEach((t: any) => {
      if (state === 'past') {
        t.mesh.visible = false;
      } else if (state === 'present') {
        t.mesh.visible = true;
        t.mesh.material.color.setHex(0xeab308); // standard yellow
      } else if (state === 'future') {
        t.mesh.visible = true;
        t.mesh.material.color.setHex(0xec4899); // future purple neon
      }
    });
  };

  // Sync timeline shifts
  useEffect(() => {
    applyTimelineState(sceneRef.current, timelineState);
  }, [timelineState]);

  // Clean up WebGL Context
  const cleanupThree = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (rendererRef.current) {
      try {
        const dom = rendererRef.current.domElement;
        if (dom && dom.parentNode) {
          dom.parentNode.removeChild(dom);
        }
        rendererRef.current.dispose();
      } catch (e) {
        console.error("Error disposing WebGL renderer:", e);
      }
      rendererRef.current = null;
    }
    sceneRef.current = null;
    cameraRef.current = null;
  };

  useEffect(() => {
    if (arMode === 'twin' && threeLoaded) {
      initThreeTwin();
    } else {
      cleanupThree();
    }
    return () => cleanupThree();
  }, [arMode, threeLoaded, destinationName]);

  // Mouse Drag Camera Rotation Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (arMode !== 'twin' || droneActive) return;
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || arMode !== 'twin' || droneActive) return;
    
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    
    cameraRotationRef.current.x -= deltaX * 0.45;
    cameraRotationRef.current.y = Math.max(12, Math.min(84, cameraRotationRef.current.y + deltaY * 0.45));

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (arMode !== 'twin' || droneActive) return;
    cameraRotationRef.current.radius = Math.max(25, Math.min(180, cameraRotationRef.current.radius + e.deltaY * 0.08));
  };

  // Add POI to Cart/Itinerary
  const handleAddToItinerary = (lm: Landmark) => {
    try {
      const cached = localStorage.getItem('gobro_cart_items');
      let cart = [];
      if (cached) {
        cart = JSON.parse(cached);
      }
      const exists = cart.some((item: any) => item.title === lm.name);
      if (!exists) {
        const newItem = {
          id: lm.id,
          title: lm.name,
          category: lm.category === 'monument' ? 'Sightseeing' : lm.category === 'restaurant' ? 'Dining' : 'Activity',
          price: lm.category === 'restaurant' ? 450 : 250,
          provider: 'AR Twin Discover',
          destName: destinationName
        };
        cart.push(newItem);
        localStorage.setItem('gobro_cart_items', JSON.stringify(cart));
        window.dispatchEvent(new Event('storage'));
        if (showToast) showToast(`📅 Added "${lm.name}" to your itinerary!`);
      } else {
        if (showToast) showToast(`ℹ️ "${lm.name}" is already in your planner.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddToWishlist = (lm: Landmark) => {
    try {
      const cached = localStorage.getItem('gobro_wishlist_destinations');
      let wishlist = [];
      if (cached) {
        wishlist = JSON.parse(cached);
      }
      if (!wishlist.includes(lm.name)) {
        wishlist.push(lm.name);
        localStorage.setItem('gobro_wishlist_destinations', JSON.stringify(wishlist));
        if (showToast) showToast(`🌟 Saved "${lm.name}" to Wishlist!`);
      } else {
        if (showToast) showToast(`ℹ️ "${lm.name}" is already saved.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Screenshot Capture
  const takeScreenshot = () => {
    const canvas = document.createElement('canvas');
    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (arMode === 'ar' && videoRef.current && cameraStatus === 'granted') {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      if (arCanvasRef.current) {
        ctx.drawImage(arCanvasRef.current, 0, 0, width, height);
      }
    } else if (arMode === 'twin' && rendererRef.current) {
      // For WebGL screenshot to work, we render one frame and copy
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
        ctx.drawImage(renderer.domElement, 0, 0, width, height);
      }
    } else {
      ctx.fillStyle = '#08080a';
      ctx.fillRect(0, 0, width, height);
      if (radarCanvasRef.current) {
        ctx.drawImage(radarCanvasRef.current, (width - height) / 2, 0, height, height);
      }
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `wanderlens-twin-capture-${destinationName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      if (showToast) showToast('📸 3D Twin Viewport snapshot saved to downloads!');
    } catch (e) {
      console.error(e);
      if (showToast) showToast('❌ Screenshot failed: cross-origin browser canvas logs block.', 'error');
    }
  };

  // AI Narrative SpeechSynthesis Read Aloud
  const startNarrator = (text: string) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.onend = () => setAudioNarrating(false);
    setAudioNarrating(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopNarrator = () => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    setAudioNarrating(false);
  };

  // Form submit for custom Time Capsules
  const handlePlaceCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapsuleName.trim() || !newCapsuleStory.trim()) return;

    const { lat: centerLat, lng: centerLng } = getCenterCoordinates();
    
    // Add small random offset for coordinate placements
    const offsetLat = centerLat + (Math.random() - 0.5) * 0.015;
    const offsetLng = centerLng + (Math.random() - 0.5) * 0.015;

    const newCap: MemoryCapsule = {
      id: `custom-cap-${Date.now()}`,
      name: newCapsuleName.trim(),
      story: newCapsuleStory.trim(),
      lat: offsetLat,
      lng: offsetLng,
      timestamp: new Date().toISOString().split('T')[0]
    };

    const updated = [...capsules, newCap];
    setCapsules(updated);

    // Dynamic addition in running WebGL context
    const scene = sceneRef.current;
    if (scene && (window as any).THREE) {
      const THREE = (window as any).THREE;
      const x = (offsetLng - centerLng) * 12500;
      const z = (centerLat - offsetLat) * 12500;
      const y = 5;

      const orbGeo = new THREE.SphereGeometry(1.3, 16, 16);
      const mat = new THREE.MeshPhongMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85
      });
      const mesh = new THREE.Mesh(orbGeo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);

      const ringGeo = new THREE.RingGeometry(1.8, 2.0, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);

      const cachedMeshes = scene.userData.capsuleMeshes || [];
      cachedMeshes.push({
        mesh,
        capsule: newCap,
        baseY: y,
        timeOffset: Math.random() * 200
      });
      scene.userData.capsuleMeshes = cachedMeshes;
    }

    setNewCapsuleName('');
    setNewCapsuleStory('');
    setShowCapsuleForm(false);
    
    if (showToast) showToast(`🔮 Placed Memory Capsule "${newCap.name}"!`);
  };

  // Download Simulated PDF Report
  const downloadPDFReport = () => {
    if (showToast) showToast('📄 Compiling PDF: Spatial analytics, AQI, and historical telemetry report...');
    
    setTimeout(() => {
      // Basic simulation of downloading a report by opening local window or fake downloads
      const content = `WanderLens travel dossier for ${destinationName}.\n\nTime telemetry: ${timelineState.toUpperCase()}\nSimulated air quality: ${timelineState === 'past' ? '0 (Clean)' : timelineState === 'present' ? '58 (Moderate)' : '22 (Clean/Electric)'}\n\nThis is a validated smart travel report.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wanderlens-${destinationName.toLowerCase()}-report.txt`;
      link.click();
      URL.revokeObjectURL(url);
      if (showToast) showToast('✅ Spatial analytics file saved to downloads!');
    }, 1200);
  };

  // Copy drone coordinate share link
  const copyDroneShareLink = () => {
    const link = `${window.location.origin}/drone/view?dest=${encodeURIComponent(destinationName)}&timeline=${timelineState}`;
    navigator.clipboard.writeText(link);
    if (showToast) showToast('🔗 Drone path share link copied to clipboard!');
  };

  // Description content depending on selected POI or capsule
  const getNarrationText = () => {
    if (selectedCapsule) {
      return `[TIME CAPSULE LOGGED ${selectedCapsule.timestamp}] Memory records read: "${selectedCapsule.story}"`;
    }
    if (activeLandmark) {
      if (activeLandmark.category === 'monument') {
        return `As an iconic local monument, ${activeLandmark.name} represents rich historical milestones of the region. Architectural surveys date the primary towers back over three centuries. Cultural chronicles record royal ceremonies and spiritual assemblies held within its fortified stone walls, preserving the heritage of ${destinationName}.`;
      }
      if (activeLandmark.category === 'restaurant') {
        return `${activeLandmark.name} is famous for preserving authentic local thali recipes passed down through generations. Sourcing organic vegetables and locally harvested spices, it provides an exquisite culinary thali experience representing the regional heritage.`;
      }
      if (activeLandmark.category === 'shopping') {
        return `${activeLandmark.name} is a lively community bazaar hosting local weavers and vendors selling silk sarees, hand-carved copper keepsakes, and spices. It has served as a central trading point for local villages since medieval silk route networks.`;
      }
      return `${activeLandmark.name} is an offbeat hidden gem surrounded by pristine waterfalls and local wildlife. Untamed by massive commercial tourism, it offers quiet trails and historic stones carved by early forest rangers.`;
    }
    return `Welcome to the Living Digital Twin of ${destinationName}. Explore coordinates, view real-time crowd heatmaps, place memory orbs, or slide the time machine back and forth.`;
  };

  // Simulated events list
  const getHistoricalEvents = () => {
    const defaultEvents = [
      { date: '1200 AD', title: 'Fortress Foundation', desc: 'Central fortified walls erected by early local kings.' },
      { date: '1680 AD', title: 'Spice Route Junction', desc: 'Sparsely populated outpost develops into a crucial trade hub.' },
      { date: '1947 AD', title: 'Modern Integration', desc: 'Incorporated into the national high speed rail corridors.' },
      { date: '2026 AD', title: 'Digital Twin Active', desc: 'WanderLens maps real-time coordinates for smart planning.' }
    ];

    const histories: Record<string, Array<{ date: string; title: string; desc: string }>> = {
      shimoga: [
        { date: '1500 AD', title: 'Keladi Dynasty Rise', desc: 'Shimoga emerges as a prominent trade capital under Keladi rule.' },
        { date: '1763 AD', title: 'Shivappa Nayaka Palace', desc: 'Massive fortress structures built along the Tunga River.' },
        { date: '1882 AD', title: 'Jog Falls Surveyed', desc: 'First official charts drawn, introducing the cascades to global maps.' },
        { date: '2026 AD', title: 'WanderLens 3D Twin', desc: 'Environment mapping logs loaded for sustainable travel.' }
      ],
      varanasi: [
        { date: '1000 BC', title: 'Ancient Vedic Capital', desc: 'Varanasi rises as the premier spiritual and cultural center of India.' },
        { date: '500 BC', title: 'Buddha Sermon Sarnath', desc: 'Lord Buddha delivers his first sermon, starting the Dharmachakra.' },
        { date: '1674 AD', title: 'Tulsi Ghat Ramayana', desc: 'Saint Tulsidas compiles the epic Ramcharitmanas along the Ganga.' },
        { date: '1916 AD', title: 'BHU Foundation', desc: 'Historic Banaras Hindu University founded, advancing education.' }
      ],
      hampi: [
        { date: '1336 AD', title: 'Vijayanagara Empire', desc: 'Harihara and Bukka found the golden capital empire of South India.' },
        { date: '1509 AD', title: 'Krishnadevaraya Ascends', desc: 'Peak of architectural beauty; the stone chariot and musical pillars built.' },
        { date: '1565 AD', title: 'Battle of Talikota', desc: 'Destruction of the city, leaving behind the mystical stone ruins.' },
        { date: '1986 AD', title: 'UNESCO Designation', desc: 'Archaeological ruins designated a protected World Heritage Site.' }
      ]
    };

    const norm = destinationName.toLowerCase();
    if (norm.includes('shimoga')) return histories.shimoga;
    if (norm.includes('varanasi')) return histories.varanasi;
    if (norm.includes('hampi')) return histories.hampi;
    return defaultEvents;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full max-w-6xl mx-auto my-4 text-left">
      
      {/* 3D Visual Viewport Panel */}
      <GlassCard hoverEffect={false} className="lg:col-span-2 relative p-4 h-[420px] md:h-[500px] overflow-hidden flex flex-col justify-between border border-white/10">
        
        {/* Drone HUD display overlay */}
        {droneActive && arMode === 'twin' && (
          <div className="absolute top-16 left-4 z-20 font-mono text-[10px] text-red-500 space-y-1 bg-black/75 p-3 rounded-xl border border-red-500/25 pointer-events-none animate-pulse">
            <p className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
              DRONE CAM ONLINE
            </p>
            <p>ALTITUDE: {simulatedAltitude} m</p>
            <p>SPEED: {simulatedSpeed} km/h</p>
            <p>TELEMETRY LINK: COPY OK</p>
          </div>
        )}

        {/* HUD labels */}
        <div className="absolute top-4 left-4 z-10 font-mono text-[9px] text-text-muted space-y-1 bg-black/45 p-2.5 rounded-xl border border-white/5 pointer-events-none">
          <p className="flex items-center gap-1.5 text-white font-bold text-[10px]">
            <Compass className="h-3.5 w-3.5 text-velvet-rose animate-spin-slow" />
            WanderLens Scan v2.5
          </p>
          <p>BEARING: {Math.round(heading)}° {heading >= 337.5 || heading < 22.5 ? 'N' : heading >= 22.5 && heading < 67.5 ? 'NE' : heading >= 67.5 && heading < 112.5 ? 'E' : heading >= 112.5 && heading < 157.5 ? 'SE' : heading >= 157.5 && heading < 202.5 ? 'S' : heading >= 202.5 && heading < 247.5 ? 'SW' : heading >= 247.5 && heading < 292.5 ? 'W' : 'NW'}</p>
          <p>MODE: {arMode.toUpperCase()}</p>
          <p>MAP GRID: {destinationName.toUpperCase()}</p>
        </div>

        {/* View mode toggle controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-1 bg-black/55 border border-white/10 p-1 rounded-full">
          <button
            onClick={() => setArMode('twin')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
              arMode === 'twin' 
                ? 'bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white shadow-md' 
                : 'text-text-muted hover:text-white'
            }`}
          >
            <Layers className="h-3 w-3" /> 🌐 3D TWIN
          </button>
          <button
            onClick={() => setArMode('radar')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
              arMode === 'radar' 
                ? 'bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white shadow-md' 
                : 'text-text-muted hover:text-white'
            }`}
          >
            <Compass className="h-3 w-3" /> 📡 RADAR
          </button>
          <button
            onClick={() => setArMode('ar')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
              arMode === 'ar' 
                ? 'bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white shadow-md' 
                : 'text-text-muted hover:text-white'
            }`}
          >
            <Camera className="h-3 w-3" /> 📷 CAMERA AR
          </button>
        </div>

        {/* Three.js Digital Twin container */}
        {arMode === 'twin' && (
          <div className="absolute inset-0 w-full h-full bg-midnight-obsidian">
            {!threeLoaded && (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-2 text-text-muted font-mono text-[10px]">
                <Loader2 className="h-6 w-6 animate-spin text-velvet-rose" />
                <span>Spinning up WebGL Digital Twin mesh...</span>
              </div>
            )}
            <div 
              ref={threeContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="w-full h-full cursor-grab active:cursor-grabbing relative"
            />

            {/* Drone & Dashboard overlay control panel inside 3D Canvas */}
            <div className="absolute bottom-16 right-4 z-20 flex flex-col gap-2">
              <button
                onClick={() => setDroneActive(!droneActive)}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold font-mono ${
                  droneActive 
                    ? 'bg-red-600 text-white border-red-500 animate-pulse' 
                    : 'bg-black/60 text-white border-white/10 hover:bg-black/80'
                }`}
              >
                {droneActive ? <Pause className="h-3.5 w-3.5 animate-spin-slow" /> : <Play className="h-3.5 w-3.5" />}
                {droneActive ? 'HALT DRONE' : 'DRONE VIEW'}
              </button>

              {droneActive && (
                <button
                  onClick={copyDroneShareLink}
                  className="p-2 bg-black/75 hover:bg-black/90 text-white border border-white/10 rounded-xl text-[9px] font-bold font-mono transition-colors flex items-center justify-center gap-1"
                >
                  <Share2 className="h-3 w-3 text-saffron-radiance" /> SHARE PATH
                </button>
              )}
            </div>
          </div>
        )}

        {/* Circular Radar Sweep */}
        {arMode === 'radar' && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/45">
            <canvas
              ref={radarCanvasRef}
              onClick={handleRadarClick}
              className="w-full h-full cursor-pointer max-h-[380px] max-w-[380px]"
            />
          </div>
        )}

        {/* Camera AR */}
        {arMode === 'ar' && (
          <div className="absolute inset-0 w-full h-full bg-black/55">
            {cameraStatus === 'granted' ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas
                  ref={arCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <Smartphone className="h-10 w-10 text-saffron-radiance animate-bounce" />
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="text-sm font-bold text-white">Compass & Video Permission Required</h4>
                  <p className="text-[11px] text-text-muted">
                    We request access to overlay named structures on your camera frame based on where your device points.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white text-xs font-bold rounded-xl transition-transform hover:scale-102 cursor-pointer"
                  >
                    Grant Camera
                  </button>
                  {sensorStatus === 'prompt' && (
                    <button
                      onClick={requestOrientationPermission}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl transition-colors hover:bg-white/10 cursor-pointer"
                    >
                      Grant Sensors
                    </button>
                  )}
                  <button
                    onClick={() => setArMode('twin')}
                    className="px-3 py-2 bg-zinc-950 text-text-muted text-xs font-bold rounded-xl transition-colors hover:text-white cursor-pointer"
                  >
                    Exit to 3D Twin
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Time Machine slider inside 3D Canvas */}
        {arMode === 'twin' && (
          <div className="absolute bottom-4 left-4 right-4 z-25 bg-black/75 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 flex items-center justify-between gap-4">
            <span className="text-[9px] font-mono font-bold text-text-muted uppercase">🕰️ Time Machine</span>
            <div className="flex-1 flex justify-between gap-1 max-w-[320px]">
              {(['past', 'present', 'future'] as const).map(state => {
                const isActive = timelineState === state;
                return (
                  <button
                    key={state}
                    onClick={() => {
                      setTimelineState(state);
                      setSelectedCapsule(null);
                      if (showToast) showToast(`⌛ Time Machine shifted to ${state.toUpperCase()}`);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold font-mono uppercase transition-all ${
                      isActive 
                        ? 'bg-saffron-radiance text-black' 
                        : 'text-text-muted hover:text-white bg-white/5'
                    }`}
                  >
                    {state}
                  </button>
                );
              })}
            </div>
            <span className="text-[9px] font-mono text-saffron-radiance font-semibold uppercase">
              {timelineState === 'past' ? '1880s Grayscale' : timelineState === 'present' ? 'Live Telemetry' : 'Smart Grid 2040'}
            </span>
          </div>
        )}

        {/* Bottom controls */}
        {arMode !== 'twin' && (
          <div className="mt-auto relative z-10 flex justify-between items-center w-full pt-4">
            <span className="text-[9px] font-mono text-text-muted bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
              CENTER POINT: {destinationName.toUpperCase()}
            </span>

            <button
              onClick={takeScreenshot}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer text-[10px] font-bold font-mono"
            >
              <Download className="h-3.5 w-3.5" /> SNAPSHOT
            </button>
          </div>
        )}
        
        {arMode === 'twin' && (
          <div className="absolute top-4 left-[140px] z-20 flex gap-2">
            <button
              onClick={takeScreenshot}
              className="p-2 bg-black/60 hover:bg-black/80 border border-white/10 text-white rounded-xl text-[9px] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> SCREENSHOT
            </button>
            <button
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className={`p-2 border rounded-xl text-[9px] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer ${
                dashboardOpen 
                  ? 'bg-velvet-rose text-white border-velvet-rose shadow-md' 
                  : 'bg-black/60 text-white border-white/10 hover:bg-black/80'
              }`}
            >
              <Activity className="h-3.5 w-3.5" /> CITY STATS
            </button>
          </div>
        )}
      </GlassCard>

      {/* Discovery POIs sidebar details */}
      <GlassCard hoverEffect={false} className="flex flex-col justify-between p-5 space-y-4 border border-white/10">
        
        {/* Dynamic Living Dashboard overlays inside sidebar */}
        {dashboardOpen && arMode === 'twin' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-saffron-radiance font-bold uppercase tracking-wider">
                Living City Analytics
              </span>
              <button 
                onClick={() => setDashboardOpen(false)}
                className="text-[9px] font-bold font-mono text-text-muted hover:text-white"
              >
                Close &times;
              </button>
            </div>
            
            <h3 className="text-base font-bold text-white font-display">Simulated Live Dashboard</h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/3 border border-white/5 rounded-xl p-2.5">
                <span className="text-[9px] text-text-muted block font-mono">AIR QUALITY (AQI)</span>
                <span className="text-white font-mono font-bold block mt-1 text-sm">
                  {timelineState === 'past' ? '0 (Organic)' : timelineState === 'present' ? '58 (Moderate)' : '22 (Electric)'}
                </span>
              </div>
              <div className="bg-white/3 border border-white/5 rounded-xl p-2.5">
                <span className="text-[9px] text-text-muted block font-mono">TRAFFIC LOAD</span>
                <span className="text-white font-mono font-bold block mt-1 text-sm">
                  {timelineState === 'past' ? 'None (Cart/Cattle)' : timelineState === 'present' ? 'Moderate (28 km/h)' : 'Automated (65 km/h)'}
                </span>
              </div>
              <div className="bg-white/3 border border-white/5 rounded-xl p-2.5">
                <span className="text-[9px] text-text-muted block font-mono">AVG QUEUE TIMES</span>
                <span className="text-white font-mono font-bold block mt-1 text-sm">
                  {timelineState === 'past' ? '0 mins' : timelineState === 'present' ? '15 mins' : '2 mins (Smart Pass)'}
                </span>
              </div>
              <div className="bg-white/3 border border-white/5 rounded-xl p-2.5">
                <span className="text-[9px] text-text-muted block font-mono">AI WEATHER CODE</span>
                <span className="text-white font-mono font-bold block mt-1 text-sm">
                  ☀️ Sunny
                </span>
              </div>
            </div>

            <button
              onClick={downloadPDFReport}
              className="w-full mt-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] font-mono tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-saffron-radiance" /> DOWNLOAD SPATIAL REPORT
            </button>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[385px] pr-1.5 scrollbar-none">
            <div className="space-y-1">
              <span className="text-[10px] text-saffron-radiance font-bold uppercase tracking-wider block">
                {arMode === 'twin' ? 'Digital Twin Nodes' : 'POIs Detected Nearby'}
              </span>
              <h3 className="text-lg font-bold font-display text-white">Spatial Discoveries</h3>
            </div>

            {/* Render POIs List */}
            <div className="space-y-2">
              {activeLandmarks.map((lm) => {
                const isActive = activeLandmark?.id === lm.id;
                let catBadge = '🏛️ Monument';
                if (lm.category === 'restaurant') catBadge = '🍽️ Dining';
                else if (lm.category === 'shopping') catBadge = '🛍️ Market';
                else if (lm.category === 'offbeat') catBadge = '💎 Gem';

                return (
                  <button
                    key={lm.id}
                    onClick={() => {
                      setActiveLandmark(lm);
                      setSelectedCapsule(null);
                      setActivePillar(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex justify-between items-center ${
                      isActive 
                        ? 'bg-purple-950/20 border-purple-500/40 text-white' 
                        : 'bg-white/2 border-white/5 text-text-muted hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="space-y-0.5 leading-tight">
                      <span className="text-xs font-bold block">{lm.name}</span>
                      <span className="text-[9px] opacity-75 font-mono">
                        {catBadge} • {(lm.bearing || 0).toFixed(0)}° Brg
                      </span>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-saffron-radiance">
                      {(lm.distance || 0).toFixed(0)}m
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time Capsule Memory Placed Orbs Section */}
            {arMode === 'twin' && (
              <div className="pt-4 border-t border-white/5 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono text-text-muted uppercase">Memory Capsules Placed</span>
                  <button
                    onClick={() => setShowCapsuleForm(!showCapsuleForm)}
                    className="text-[9px] font-bold text-saffron-radiance hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    + Place Orb
                  </button>
                </div>

                {showCapsuleForm && (
                  <form onSubmit={handlePlaceCapsule} className="bg-white/3 border border-white/10 rounded-2xl p-3 mb-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Capsule Title"
                      value={newCapsuleName}
                      onChange={(e) => setNewCapsuleName(e.target.value)}
                      className="w-full bg-black/45 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-velvet-rose/50"
                      required
                    />
                    <textarea
                      placeholder="Share your story or memory log..."
                      value={newCapsuleStory}
                      onChange={(e) => setNewCapsuleStory(e.target.value)}
                      rows={2}
                      className="w-full bg-black/45 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-velvet-rose/50 scrollbar-none"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-md"
                    >
                      Bury Capsule Orb
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 gap-2.5">
                  {capsules.map(cap => (
                    <button
                      key={cap.id}
                      onClick={() => {
                        setSelectedCapsule(cap);
                        setActiveLandmark(null);
                        setActivePillar(null);
                      }}
                      className={`w-full text-left p-2.5 border rounded-xl transition-all ${
                        selectedCapsule?.id === cap.id
                          ? 'bg-purple-950/30 border-purple-500/50 text-white'
                          : 'bg-white/2 border-white/5 text-text-muted hover:bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold">🔮 {cap.name}</span>
                        <span className="font-mono text-[8px] opacity-75">{cap.timestamp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Famous Events Timeline card slider */}
            {arMode === 'twin' && (
              <div className="pt-4 border-t border-white/5 text-left select-none">
                <span className="text-[10px] font-mono text-text-muted uppercase block mb-2">Chronicle Event Timeline</span>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {getHistoricalEvents().map((ev, idx) => (
                    <div 
                      key={idx} 
                      className="min-w-[170px] max-w-[170px] bg-white/2 border border-white/5 p-2.5 rounded-xl text-left leading-tight flex-shrink-0"
                    >
                      <span className="text-[9px] font-bold text-saffron-radiance font-mono">{ev.date}</span>
                      <h4 className="text-[10px] font-bold text-white mt-0.5">{ev.title}</h4>
                      <p className="text-[9px] text-text-muted mt-1 leading-relaxed">{ev.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* POI Narrative detail view & audio read aloud button */}
        {!dashboardOpen && (
          <div className="bg-white/3 border border-white/5 rounded-2xl p-3.5 space-y-3 relative z-10">
            <div className="flex justify-between items-start">
              <div className="text-left flex-1 pr-2">
                <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider block">
                  {selectedCapsule ? '🔮 Open Time Capsule' : activePillar ? '📍 Telemetry Pillar Info' : '📖 Spatial Narrator'}
                </span>
                <h4 className="text-xs font-bold text-white mt-0.5">
                  {selectedCapsule ? selectedCapsule.name : activeLandmark ? activeLandmark.name : 'AI Co-Pilot Historian'}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {audioNarrating ? (
                  <button
                    onClick={stopNarrator}
                    className="p-1.5 rounded-lg bg-red-600 text-white border border-red-500 hover:bg-red-700 transition-colors cursor-pointer flex items-center justify-center"
                    title="Stop Audio"
                  >
                    <VolumeX className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => startNarrator(getNarrationText())}
                    className="p-1.5 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
                    title="Narrate Audio"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-saffron-radiance" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-[10px] text-text-muted leading-relaxed text-left max-h-[85px] overflow-y-auto scrollbar-none">
              {getNarrationText()}
            </p>

            {activeLandmark && (
              <div className="flex gap-2 pt-1 border-t border-white/5">
                <button
                  onClick={() => handleAddToItinerary(activeLandmark)}
                  className="flex-1 py-1.5 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white text-[9px] font-bold rounded-lg transition-all hover:scale-102 flex items-center justify-center gap-1 cursor-pointer shadow"
                >
                  <Plus className="h-3 w-3" /> Add Itinerary
                </button>
                <button
                  onClick={() => handleAddToWishlist(activeLandmark)}
                  className="py-1.5 px-2 bg-white/5 border border-white/10 text-white text-[9px] font-bold rounded-lg transition-colors hover:bg-white/10 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Heart className="h-3 w-3 text-red-500 fill-red-500" /> Save
                </button>
              </div>
            )}
          </div>
        )}
      </GlassCard>

    </div>
  );
}
