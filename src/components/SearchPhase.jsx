import React, { useState, useEffect, useMemo } from 'react';
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

    // Shooting Star Logic (Comet Style)
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

    // Background Parallax - INVERTED Logic: Now moves WITH phone movement (Positive)
    const bgX = orientation.alpha * 5;
    const bgY = orientation.beta * 5;

    // --- STAR GENERATION (Memoized to prevent flickering on re-render) ---
    const bgStars = useMemo(() => [...Array(200)].map((_, i) => ({
        id: i,
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        size: Math.random() * 1.5 + 0.5 + 'px',
        opacity: Math.random() * 0.5 + 0.3,
        delay: Math.random() * 5 + 's' // Random twinkle delay
    })), []);

    const midStars = useMemo(() => [...Array(50)].map((_, i) => ({
        id: i,
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        size: Math.random() * 2 + 1 + 'px',
        boxShadow: `0 0 ${Math.random() * 4}px rgba(255,255,255,0.5)`,
        delay: Math.random() * 5 + 's'
    })), []);

    const brightStars = useMemo(() => [...Array(15)].map((_, i) => {
        const sizeVal = Math.random() * 3 + 2;
        const color = ['#ffffff', '#e0f7fa', '#fff3e0'][Math.floor(Math.random() * 3)];
        return {
            id: i,
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            size: sizeVal + 'px',
            color: color,
            boxShadow: `0 0 ${sizeVal * 4}px ${sizeVal}px ${color}80`,
            delay: Math.random() * 5 + 's'
        };
    }), []);

    return (
        <div className="relative w-full h-full overflow-hidden bg-black transition-all duration-1000 ease-out">
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

            {/* Directional Guide (Arrow) - Hollow Style - BOOST Z-INDEX */}
            {!found && distance > 25 && (
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60] transition-opacity duration-500"
                    style={{ opacity: Math.min(1, Math.max(0, (distance - 20) / 20)) }}
                >
                    <motion.div
                        className="w-24 h-24 rounded-full border-2 border-terminal-green flex items-center justify-center box-shadow-[0_0_20px_#33ff00]" /* Removed bg-terminal-green/20 */
                        animate={{ rotate: arrowAngle }}
                        transition={{ type: "spring", stiffness: 40, damping: 10 }}
                    >
                        <ChevronUp className="text-terminal-green w-10 h-10 animate-bounce-slow drop-shadow-[0_0_10px_#33ff00]" strokeWidth={2.5} /> {/* Changed to terminal-green for hollow look */}
                    </motion.div>
                    <div className="absolute mt-32 text-white font-bold text-sm font-mono bg-terminal-green/20 px-4 py-1 rounded backdrop-blur border border-terminal-green">
                        SIGNAL: {(100 - Math.min(100, distance)).toFixed(0)}%
                    </div>
                </div>
            )}

            {/* --- RICH STARFIELD LAYERS (Memoized) --- */}

            {/* Layer 1: Distant Background Stars */}
            <div
                className="absolute inset-[-100%] will-change-transform" /* Removed opacity-40 */
                style={{
                    transform: `translate3d(${bgX % 1000}px, ${bgY % 1000}px, 0)`,
                }}
            >
                {bgStars.map((star) => (
                    <div key={`star-bg-${star.id}`} className="absolute bg-white rounded-full animate-twinkle"
                        style={{
                            width: star.size,
                            height: star.size,
                            top: star.top,
                            left: star.left,
                            opacity: star.opacity,
                            animationDelay: star.delay
                        }}
                    />
                ))}
            </div>

            {/* Layer 2: Mid-range Stars */}
            <div
                className="absolute inset-[-100%] will-change-transform" /* Removed opacity, default 1.0 */
                style={{
                    transform: `translate3d(${bgX * 1.5 % 1500}px, ${bgY * 1.5 % 1500}px, 0)`,
                }}
            >
                {midStars.map((star) => (
                    <div key={`star-mid-${star.id}`} className="absolute bg-white rounded-full animate-twinkle"
                        style={{
                            width: star.size,
                            height: star.size,
                            top: star.top,
                            left: star.left,
                            boxShadow: star.boxShadow,
                            animationDelay: star.delay
                        }}
                    />
                ))}
            </div>

            {/* Layer 3: First Magnitude Stars & Constellations */}
            <div
                className="absolute inset-[-100%] will-change-transform"
                style={{
                    transform: `translate3d(${bgX * 0.8 % 2000}px, ${bgY * 0.8 % 2000}px, 0)`,
                }}
            >
                {/* Random Bright Stars */}
                {brightStars.map((star) => (
                    <div key={`star-bright-${star.id}`} className="absolute rounded-full animate-twinkle"
                        style={{
                            backgroundColor: star.color,
                            width: star.size,
                            height: star.size,
                            top: star.top,
                            left: star.left,
                            boxShadow: star.boxShadow,
                            animationDelay: star.delay
                        }}
                    />
                ))}

                {/* Constellation: "The Dipper" (Stays Static relative to this layer) */}
                <div className="absolute top-[20%] left-[30%] w-60 h-40 opacity-70">
                    <div className="absolute top-[10%] left-[80%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] animate-twinkle" style={{ animationDelay: '1s' }} /> {/* Handle Tip */}
                    <div className="absolute top-[15%] left-[65%] w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white] animate-twinkle" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-[25%] left-[50%] w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white] animate-twinkle" /> {/* Handle/Bowl Join */}
                    <div className="absolute top-[40%] left-[40%] w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white] animate-twinkle" style={{ animationDelay: '3s' }} /> {/* Bowl Top Back */}
                    <div className="absolute top-[60%] left-[45%] w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white] animate-twinkle" /> {/* Bowl Bottom Back */}
                    <div className="absolute top-[60%] left-[20%] w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white] animate-twinkle" style={{ animationDelay: '4s' }} /> {/* Bowl Bottom Front */}
                    <div className="absolute top-[40%] left-[15%] w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white] animate-twinkle" style={{ animationDelay: '1.5s' }} /> {/* Bowl Top Front */}
                    {/* Lines */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none opacity-30">
                        <path d="M80 10 L65 15 L50 25 L40 40 L45 60 L20 60 L15 40 L40 40" fill="none" stroke="white" strokeWidth="0.5" />
                    </svg>
                </div>

                {/* Constellation: "Orion's Belt ish" */}
                <div className="absolute top-[70%] left-[60%] w-40 h-20 opacity-70">
                    <div className="absolute top-[50%] left-[10%] w-2 h-2 bg-[#e0f7fa] rounded-full shadow-[0_0_8px_#e0f7fa] animate-twinkle" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute top-[45%] left-[50%] w-2 h-2 bg-[#e0f7fa] rounded-full shadow-[0_0_8px_#e0f7fa] animate-twinkle" style={{ animationDelay: '2.5s' }} />
                    <div className="absolute top-[40%] left-[90%] w-2 h-2 bg-[#e0f7fa] rounded-full shadow-[0_0_8px_#e0f7fa] animate-twinkle" style={{ animationDelay: '1.2s' }} />
                    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none opacity-30">
                        <path d="M10 50 L50 45 L90 40" fill="none" stroke="white" strokeWidth="0.5" />
                    </svg>
                </div>
            </div>

            {/* Shooting Star (Comet Style) */}
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
                            rotate: '25deg' // Consistent aesthetic angle
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
