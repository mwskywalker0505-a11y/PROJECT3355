import React, { useState, useEffect, useRef } from 'react';
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

            const newOrientation = { alpha, beta, gamma };
            setOrientation(newOrientation);

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
    // Shooting Star Logic (Comet Style)
    // Colors: White, Cyan (Ice), Green (Terminal), Gold (Dust)
    const COMET_COLORS = [
        { head: 'rgba(255,255,255,0.9)', tail: 'from-transparent via-white/50 to-white' },
        { head: 'rgba(51,255,0,0.9)', tail: 'from-transparent via-[#33ff00]/50 to-[#33ff00]' },
        { head: 'rgba(0,255,255,0.9)', tail: 'from-transparent via-[#00ffff]/50 to-[#00ffff]' },
        { head: 'rgba(255,204,0,0.9)', tail: 'from-transparent via-[#ffcc00]/50 to-[#ffcc00]' }
    ];

    useEffect(() => {
        let timeout;

        const scheduleStar = () => {
            // Random delay between 4s and 10s (Increased frequency)
            const delay = 4000 + Math.random() * 6000;

            timeout = setTimeout(() => {
                triggerStar();
                scheduleStar();
            }, delay);
        };

        const triggerStar = () => {
            const color = COMET_COLORS[Math.floor(Math.random() * COMET_COLORS.length)];
            setShootingStar({
                id: Date.now(),
                top: Math.random() * 60 + '%',
                left: Math.random() * 80 + '%',
                scale: 0.8 + Math.random() * 0.5,
                color: color
            });

            setTimeout(() => setShootingStar(null), 3000);
        };

        scheduleStar();
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

    // Background Parallax (Sine Wave for Seamless Continuous Movement)
    // We use Sin/Cos to create a gentle swaying that never jumps or runs out of image.
    // Multiplier 80: Pixel range of movement (+/- 80px)
    const bgX = Math.sin(orientation.alpha * (Math.PI / 180)) * 80;
    const bgY = Math.sin(orientation.beta * (Math.PI / 180)) * 80;

    return (
        <div className="relative w-full h-full overflow-hidden bg-black transition-all duration-1000 ease-out">
            {/* STATIC BACKGROUND IMAGE (NASA STYLE) */}
            {/* Parallax Enabled: Sine Wave "Sway" */}
            {/* transition-none is CRITICAL to prevent "laggy" feel */}
            <div
                className="absolute inset-[-50%] w-[200%] h-[200%] z-0 opacity-60 transition-none"
                style={{
                    backgroundImage: `url(${ASSETS.NASA_BG})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: `translate3d(${bgX}px, ${bgY}px, 0)` // Positive = Following effect
                }}
            />

            {/* Instruction Message */}
            {
                !found && (
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
                )
            }

            {/* Directional Guide (Arrow) - Hollow Style */}
            {
                !found && distance > 25 && (
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
                )
            }



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
                        <div
                            className="absolute w-2 h-2 bg-white rounded-full"
                            style={{ boxShadow: `0 0 15px 4px ${shootingStar.color.head}` }}
                        />
                        {/* Comet Tail */}
                        <div className={`absolute top-1/2 right-full w-[200px] h-[2px] bg-gradient-to-r ${shootingStar.color.tail} -translate-y-1/2 origin-right`} />
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
                <div className={`relative w-full h-full transition-all duration-300 ${moonVisible ? 'brightness-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'brightness-50 opacity-40'} `}>
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
        </div >
    );
}
