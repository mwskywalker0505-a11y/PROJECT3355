import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

// Moon position in degrees (Target) - Made harder to find
// Farther from "neutral" (90, 0)
const TARGET_POSITION = { beta: 45, gamma: 45 };
const HIT_TOLERANCE = 15; // Degrees of tolerance

export default function SearchPhase({ onFound }) {
    const [orientation, setOrientation] = useState({ beta: 90, gamma: 0 });
    const [found, setFound] = useState(false);

    // Guide Helpers
    const [distance, setDistance] = useState(100);
    const [angle, setAngle] = useState(0);

    const layer1Ref = useRef(null);

    useEffect(() => {
        const handleOrientation = (event) => {
            // Basic clamping and defaults
            const beta = event.beta || 90;
            const gamma = event.gamma || 0;
            setOrientation({ beta, gamma });

            // Calculate distance for guide intensity
            const dGamma = TARGET_POSITION.gamma - gamma;
            const dBeta = TARGET_POSITION.beta - beta;
            const dist = Math.sqrt(dGamma * dGamma + dBeta * dBeta);
            setDistance(dist);

            // Calculate angle for arrow rotation (pointing towards target)
            // atan2(y, x) -> y is beta diff, x is gamma diff
            // On screen: Gamma moves X, Beta moves "Y" (but inverted logic usually for tilt)
            // If target Beta is lower (45) than current (90), we need to look "UP" (screen coordinates)
            // Let's use screen coordinate deltas:
            const screenX = dGamma; // Target is right if dGamma > 0
            const screenY = -dBeta; // Target is UP if dBeta < 0 (Target 45 < Current 90) -> screenY positive? 
            // Wait, standard atan2(y, x). 
            // If we need to tilt "UP" (lower beta), arrow should point UP.
            // visual Y is negative UP in CSS transform? No, 0,0 is center.
            const radians = Math.atan2(screenY, screenX);
            const deg = radians * (180 / Math.PI);
            setAngle(deg + 90); // +90 to align 'Up' arrow to 0 deg? 
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    // Check if target is in view (for hit testing)
    const moonVisible = distance < HIT_TOLERANCE;

    const handleLockComplete = () => {
        if (!found) {
            setFound(true);
            onFound();
        }
    };

    // Parallax calculations
    const deltaBeta = orientation.beta - 90;
    const deltaGamma = orientation.gamma;

    const p1 = { x: deltaGamma * 2, y: deltaBeta * 2 };
    const p2 = { x: deltaGamma * 5, y: deltaBeta * 5 };
    const p3 = { x: deltaGamma * 10, y: deltaBeta * 10 };

    // Moon position on screen relative to center
    // Increased scale to make it feel "further" away movement-wise
    const moonX = (TARGET_POSITION.gamma - orientation.gamma) * 20;
    const moonY = (orientation.beta - TARGET_POSITION.beta) * 20;

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
                            TARGET LOST. SEARCH VISUALS.
                        </p>
                        <p className="text-white text-xs mt-1 font-sans">
                            月をみつけてください
                        </p>
                    </motion.div>
                </div>
            )}

            {/* Directional Guide (Arrow) */}
            {!found && distance > 20 && (
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 transition-opacity duration-500"
                    style={{ opacity: Math.min(1, distance / 50) }} // Fade out when close
                >
                    <motion.div
                        className="w-24 h-24 rounded-full border border-terminal-green/20 flex items-center justify-center"
                        animate={{ rotate: angle }}
                        transition={{ type: "spring", stiffness: 50 }}
                    >
                        <ChevronUp className="text-terminal-green w-8 h-8 animate-bounce-slow" />
                    </motion.div>
                    <div className="absolute mt-32 text-terminal-green/50 text-[10px] font-mono">
                        DST: {distance.toFixed(1)}
                    </div>
                </div>
            )}

            {/* Background - Far Stars */}
            <div
                className="absolute inset-[-50vmax] opacity-40 will-change-transform"
                style={{ transform: `translate3d(${-p1.x}px, ${p1.y}px, 0)` }}
            >
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-repeat" />
                {[...Array(30)].map((_, i) => (
                    <div key={`star1-${i}`} className="absolute bg-white rounded-full w-1 h-1"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random()
                        }}
                    />
                ))}
            </div>

            {/* Mid Stars */}
            <div
                className="absolute inset-[-50vmax] opacity-60 will-change-transform"
                style={{ transform: `translate3d(${-p2.x}px, ${p2.y}px, 0)` }}
            >
                {[...Array(20)].map((_, i) => (
                    <div key={`star2-${i}`} className="absolute bg-white rounded-full w-1.5 h-1.5"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.8
                        }}
                    />
                ))}
            </div>

            {/* Near Stars */}
            <div
                className="absolute inset-[-50vmax] opacity-80 will-change-transform"
                style={{ transform: `translate3d(${-p3.x}px, ${p3.y}px, 0)` }}
            >
                {[...Array(15)].map((_, i) => (
                    <div key={`star3-${i}`} className="absolute bg-white rounded-full w-2 h-2 blur-[1px]"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random()
                        }}
                    />
                ))}
            </div>

            {/* The Moon */}
            <div
                className="absolute top-1/2 left-1/2 w-48 h-48 -ml-24 -mt-24 rounded-full cursor-none will-change-transform group"
                style={{
                    transform: `translate3d(${moonX}px, ${moonY}px, 0)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Moon Visual */}
                <div className={`relative w-full h-full transition-all duration-300 ${moonVisible ? 'brightness-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'brightness-50 opacity-40'}`}>
                    <img src="/moon.png" alt="Moon" className="w-full h-full object-contain rounded-full mix-blend-screen" />

                    {/* Locking UI */}
                    {moonVisible && !found && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            {/* Lock Circle */}
                            <svg className="w-64 h-64 animate-spin-slow opacity-80" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="#33ff00" strokeWidth="0.5" strokeDasharray="4 2" />
                            </svg>

                            {/* Target Reticle */}
                            <div className="absolute w-56 h-56 border border-terminal-green/30 rounded-full" />

                            {/* Proximity / Locking Gauge */}
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

            {/* Crosshair / HUD Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                <div className="w-8 h-8 border border-terminal-green/50" />
                <div className="absolute w-12 h-[1px] bg-terminal-green/50" />
                <div className="absolute h-12 w-[1px] bg-terminal-green/50" />
            </div>
        </div>
    );
}
