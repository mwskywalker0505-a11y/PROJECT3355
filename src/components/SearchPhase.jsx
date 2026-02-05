import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { ASSETS } from '../constants';
import { audioManager } from '../utils/AudioManager';

// Shortest distance between two angles (degrees)
const getAngleDistance = (target, current) => {
    let diff = target - current;
    // Normalize to -180 to 180
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    return diff;
};

// Helper: Generate CSS Box-Shadow string for starfield
// n: number of stars, w/h: spread area
const generateStarShadows = (n) => {
    let value = '';
    for (let i = 0; i < n; i++) {
        const x = Math.floor(Math.random() * 2000);
        const y = Math.floor(Math.random() * 2000);
        value += `${x}px ${y}px #FFF, `;
    }
    return value.slice(0, -2);
};

const HIT_TOLERANCE = 8; // Degrees

export default function SearchPhase({ onFound }) {
    // Current device orientation
    const [orientation, setOrientation] = useState({ alpha: 0, beta: 90, gamma: 0 });
    // Target position (Wait for calibration)
    const [target, setTarget] = useState(null);
    const [found, setFound] = useState(false);
    const [calibrated, setCalibrated] = useState(false);

    // Guide Helpers
    const [distance, setDistance] = useState(100);
    const [arrowAngle, setArrowAngle] = useState(0);

    // Shooting Star State
    const [shootingStar, setShootingStar] = useState(null);

    useEffect(() => {
        const handleOrientation = (event) => {
            const alpha = event.alpha || 0;
            const beta = event.beta || 90;
            const gamma = event.gamma || 0;

            setOrientation({ alpha, beta, gamma });

            // Set Target ONCE relative to initial user position
            if (!calibrated && event.alpha !== null) {
                setCalibrated(true);

                // Spawn target with MINIMUM distance to avoid instant lock
                // Offset: Randomly +/- (60 to 150 degrees)
                const minOffset = 60;
                const range = 90; // 60 + 90 = 150 max
                const direction = Math.random() > 0.5 ? 1 : -1;
                const offset = direction * (minOffset + Math.random() * range);

                setTarget({
                    alpha: (alpha + offset + 360) % 360,
                    beta: Math.min(120, Math.max(30, beta + (Math.random() * 40 - 20)))
                });
            }

            if (!target) return;

            // Calculate diffs
            const dAlpha = getAngleDistance(target.alpha, alpha);
            const dBeta = target.beta - beta;
            const dist = Math.sqrt(dAlpha * dAlpha + dBeta * dBeta);
            setDistance(dist);

            // Arrow Angle (Inverted logic)
            const vecX = -dAlpha;
            const vecY = -dBeta;
            const rad = Math.atan2(vecY, vecX);
            const deg = rad * (180 / Math.PI);
            setArrowAngle(deg + 90);
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [target, calibrated]);

    // Shooting Star Logic (Comet Style) - KEEPING THIS as it was working fine
    useEffect(() => {
        let timeout;

        const scheduleStar = () => {
            // Random delay between 10s and 25s for consistent but natural intervals
            const delay = 10000 + Math.random() * 15000;

            timeout = setTimeout(() => {
                triggerStar();
                scheduleStar(); // Schedule next one
            }, delay);
        };

        const triggerStar = () => {
            setShootingStar({
                id: Date.now(),
                top: Math.random() * 60 + '%', // Keep in upper 60% of screen
                left: Math.random() * 80 + '%',
                scale: 0.8 + Math.random() * 0.5 // Various sizes
            });

            // Reset after animation (matches duration)
            setTimeout(() => setShootingStar(null), 3000);
        };

        scheduleStar(); // Start loop
        return () => clearTimeout(timeout);
    }, []);

    const moonVisible = distance < HIT_TOLERANCE * 1.5;

    const handleLockComplete = () => {
        if (!found) {
            setFound(true);
            onFound();
        }
    };

    // Lock-on Audio Loop
    useEffect(() => {
        let interval;
        if (moonVisible && !found) {
            audioManager.play(ASSETS.SE_KEIKOKU);
            interval = setInterval(() => {
                audioManager.play(ASSETS.SE_KEIKOKU);
            }, 400);
        }
        return () => clearInterval(interval);
    }, [moonVisible, found]);

    if (!target) return <div className="w-full h-full bg-black text-terminal-green flex items-center justify-center font-mono">INITIALIZING SENSORS...</div>;

    // Screen Position Calculation
    const SCALE = 15;
    const dAlpha = getAngleDistance(target.alpha, orientation.alpha);
    const dBeta = target.beta - orientation.beta;
    const moonX = -dAlpha * SCALE;
    const moonY = -dBeta * SCALE;

    // Background Parallax
    const bgX = orientation.alpha * 5;
    const bgY = orientation.beta * 5;

    // --- STATIC STARFIELD GENERATION (Memoized) ---
    // We generate a static "map" of stars using box-shadows.
    // Drastically reduced counts to prevent rendering crashes on mobile.

    // Layer 1: Small (Far)
    const starShadowsSmall = React.useMemo(() => generateStarShadows(50), []); // Was 700
    // Layer 2: Medium (Mid)
    const starShadowsMedium = React.useMemo(() => generateStarShadows(20), []); // Was 200
    // Layer 3: Large (Near)
    const starShadowsLarge = React.useMemo(() => generateStarShadows(10), []); // Was 100

    return (
        <div className="relative w-full h-full overflow-hidden bg-black transition-all duration-1000 ease-out">
            {/* --- STARFIELD LAYERS (Box-Shadow Technique) --- */}
            {/* The container is 2000x2000 to allow scrolling, centered roughly */}

            {/* Layer 1: Stars 1px (Slowest) */}
            <div
                className="absolute w-[1px] h-[1px] bg-transparent rounded-full animate-twinkle opacity-60"
                style={{
                    boxShadow: starShadowsSmall,
                    transform: `translate3d(${bgX * 0.2 % 2000}px, ${bgY * 0.2 % 2000}px, 0)`,
                }}
            />

            {/* Layer 2: Stars 2px (Medium Speed) */}
            <div
                className="absolute w-[2px] h-[2px] bg-transparent rounded-full animate-twinkle opacity-80"
                style={{
                    boxShadow: starShadowsMedium,
                    transform: `translate3d(${bgX * 0.5 % 2000}px, ${bgY * 0.5 % 2000}px, 0)`,
                    animationDelay: '-2s'
                }}
            />

            {/* Layer 3: Stars 3px (Fastest) */}
            <div
                className="absolute w-[3px] h-[3px] bg-transparent rounded-full animate-twinkle"
                style={{
                    boxShadow: starShadowsLarge,
                    transform: `translate3d(${bgX * 1.0 % 2000}px, ${bgY * 1.0 % 2000}px, 0)`,
                    animationDelay: '-1s'
                }}
            />
            {/* Instruction Message */}
            {!found && (
                <div className="absolute top-20 left-0 w-full text-center z-50 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="bg-black/50 backdrop-blur-sm py-2 px-6 inline-block rounded-full border border-terminal-green/30"
                    >
                        <p className="text-terminal-green font-mono text-sm tracking-widest animate-pulse">
                            SCANNING SECTOR...
                        </p>
                        <p className="text-white text-xs mt-1 font-sans">
                            体を回して、月を探してください
                        </p>
                    </motion.div>
                </div>
            )}

            {/* Directional Guide (Arrow) - Hollow Style - KEPING Z-INDEX BOOST just in case */}
            {!found && distance > 25 && (
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60] transition-opacity duration-500"
                    style={{ opacity: Math.min(1, Math.max(0, (distance - 20) / 20)) }}
                >
                    <motion.div
                        className="w-24 h-24 rounded-full border-2 border-terminal-green flex items-center justify-center box-shadow-[0_0_20px_#33ff00]"
                        animate={{ rotate: arrowAngle }}
                        transition={{ type: "spring", stiffness: 40, damping: 10 }}
                    >
                        <ChevronUp className="text-terminal-green w-10 h-10 animate-bounce-slow drop-shadow-[0_0_10px_#33ff00]" strokeWidth={2.5} />
                    </motion.div>
                    <div className="absolute mt-32 text-white font-bold text-sm font-mono bg-terminal-green/20 px-4 py-1 rounded backdrop-blur border border-terminal-green">
                        SIGNAL: {(100 - Math.min(100, distance)).toFixed(0)}%
                    </div>
                </div>
            )}



            {/* Shooting Star (Comet Style) - Maintained */}
            <AnimatePresence>
                {shootingStar && (
                    <motion.div
                        initial={{ opacity: 0, translateX: 0, translateY: 0, scale: shootingStar.scale }}
                        animate={{ opacity: [0, 1, 1, 0], translateX: 400, translateY: 200 }} // Slower, longer arc
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                        className="absolute z-10 pointer-events-none"
                        style={{
                            top: shootingStar.top,
                            left: shootingStar.left,
                            rotate: '25deg'
                        }}
                    >
                        {/* Comet Head */}
                        <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_15px_4px_rgba(255,255,255,0.9)]" />
                        {/* Comet Tail */}
                        <div className="absolute top-1/2 right-full w-[200px] h-[2px] bg-gradient-to-r from-transparent via-white/50 to-white -translate-y-1/2 origin-right" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The Moon */}
            <div
                className="absolute top-1/2 left-1/2 w-64 h-64 -ml-32 -mt-32 rounded-full cursor-none will-change-transform group"
                style={{
                    transform: `translate3d(${moonX}px, ${moonY}px, 0)`,
                    visibility: (Math.abs(moonX) > window.innerWidth || Math.abs(moonY) > window.innerHeight) ? 'hidden' : 'visible'
                }}
            >
                <div className={`relative w-full h-full transition-all duration-300 ${moonVisible ? 'brightness-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'brightness-50 opacity-40'}`}>
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundImage: `url(${ASSETS.MOON})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    />

                    {/* Locking UI */}
                    {moonVisible && !found && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-80 h-80 animate-spin-slow opacity-80" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="#33ff00" strokeWidth="0.5" strokeDasharray="4 2" />
                            </svg>

                            <div className="absolute w-72 h-72 border border-terminal-green/30 rounded-full" />

                            <div className="absolute top-full mt-4 text-terminal-green text-xs font-mono tracking-widest text-center">
                                LOCKING TARGET...
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3.0, ease: "linear" }}
                                    onAnimationComplete={handleLockComplete}
                                    className="h-1 bg-terminal-green mt-1"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-8 h-8 border border-terminal-green/50" />
                <div className="absolute w-12 h-[1px] bg-terminal-green/50" />
                <div className="absolute h-12 w-[1px] bg-terminal-green/50" />
            </div>
        </div>
    );
}
