import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

// Shortest distance between two angles (degrees)
const getAngleDistance = (target, current) => {
    let diff = target - current;
    // Normalize to -180 to 180
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    return diff;
};

const HIT_TOLERANCE = 8; // Degrees (Tightened for pinpoint targeting)

export default function SearchPhase({ onFound }) {
    // Current device orientation
    const [orientation, setOrientation] = useState({ alpha: 0, beta: 90, gamma: 0 });
    // Target position (Wait for calibration)
    const [target, setTarget] = useState(null);
    const [found, setFound] = useState(false);

    // Determining if we have initial orientation to set relative target
    const [calibrated, setCalibrated] = useState(false);

    // Guide Helpers
    const [distance, setDistance] = useState(100);
    const [arrowAngle, setArrowAngle] = useState(0);

    const layer1Ref = useRef(null);

    useEffect(() => {
        const handleOrientation = (event) => {
            // Alpha: Rotation around Z axis (0-360) - Direction user is facing
            // Beta: Rotation around X axis (-180 to 180) - Tilt front/back
            // Gamma: Rotation around Y axis (-90 to 90) - Tilt left/right

            const alpha = event.alpha || 0;
            const beta = event.beta || 90;
            const gamma = event.gamma || 0;

            setOrientation({ alpha, beta, gamma });

            // Set Target ONCE relative to initial user position
            if (!calibrated && event.alpha !== null) {
                setCalibrated(true);
                // Spawn target nearby: +/- 90 deg horizontal, +/- 20 deg vertical
                setTarget({
                    alpha: (alpha + (Math.random() * 180 - 90) + 360) % 360,
                    beta: Math.min(120, Math.max(30, beta + (Math.random() * 40 - 20)))
                });
            }

            if (!target) return; // Wait for target

            // Calculate diffs
            const dAlpha = getAngleDistance(target.alpha, alpha);
            const dBeta = target.beta - beta;

            // Distance (Euclidean approximate on sphere surface for small segments)
            const dist = Math.sqrt(dAlpha * dAlpha + dBeta * dBeta);
            setDistance(dist);

            // Arrow Angle
            // Inverted based on user feedback (Standard mapping for Alpha was reversed for screen)
            // dAlpha > 0 (Left/CCW) -> vecX < 0 (Left on screen)
            const vecX = -dAlpha;
            const vecY = -dBeta;

            const rad = Math.atan2(vecY, vecX);
            const deg = rad * (180 / Math.PI);
            setArrowAngle(deg + 90);
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [target, calibrated]);

    // Check visibility
    const moonVisible = distance < HIT_TOLERANCE * 1.5;

    const handleLockComplete = () => {
        if (!found) {
            setFound(true);
            onFound();
        }
    };

    // If not calibrated/target set yet, show simpler loading or nothing
    if (!target) return <div className="w-full h-full bg-black text-terminal-green flex items-center justify-center font-mono">INITIALIZING SENSORS...</div>;

    // Screen Position Calculation
    // Inverted Logic:
    const SCALE = 15;
    const dAlpha = getAngleDistance(target.alpha, orientation.alpha);
    const dBeta = target.beta - orientation.beta;

    // Moon position negated to match the "Move phone TO arrow" intuition
    // and match the Inverted Arrow logic above.
    const moonX = -dAlpha * SCALE;
    const moonY = -dBeta * SCALE;

    // Star parallax (Infinite distance, just moves based on orientation)
    const bgX = orientation.alpha * 5;
    const bgY = orientation.beta * 5;

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

            {/* Directional Guide (Arrow) */}
            {!found && distance > 25 && (
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 transition-opacity duration-500"
                    style={{ opacity: Math.min(1, Math.max(0, (distance - 20) / 20)) }}
                >
                    <motion.div
                        className="w-24 h-24 rounded-full border border-terminal-green/20 flex items-center justify-center"
                        animate={{ rotate: arrowAngle }}
                        transition={{ type: "spring", stiffness: 40, damping: 10 }}
                    >
                        <ChevronUp className="text-terminal-green w-8 h-8 animate-bounce-slow" />
                    </motion.div>
                    <div className="absolute mt-32 text-terminal-green/50 text-[10px] font-mono bg-black/50 px-2 rounded">
                        SIGNAL: {(100 - Math.min(100, distance)).toFixed(0)}%
                    </div>
                </div>
            )}

            {/* Background - Tiled Stars that move with parallax */}
            <div
                className="absolute inset-[-100%] will-change-transform opacity-50"
                style={{
                    transform: `translate3d(${-bgX % 1000}px, ${bgY % 1000}px, 0)`,
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
                    backgroundRepeat: 'repeat'
                }}
            />
            {/* Additional star layers for depth */}
            <div
                className="absolute inset-[-100%] will-change-transform opacity-70"
                style={{
                    transform: `translate3d(${-bgX * 1.5 % 1500}px, ${bgY * 1.5 % 1500}px, 0)`
                }}
            >
                {[...Array(40)].map((_, i) => (
                    <div key={`star-${i}`} className="absolute bg-white rounded-full"
                        style={{
                            width: Math.random() * 2 + 'px',
                            height: Math.random() * 2 + 'px',
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random()
                        }}
                    />
                ))}
            </div>

            {/* The Moon */}
            <div
                className="absolute top-1/2 left-1/2 w-64 h-64 -ml-32 -mt-32 rounded-full cursor-none will-change-transform group"
                style={{
                    transform: `translate3d(${moonX}px, ${moonY}px, 0)`,
                    visibility: (Math.abs(moonX) > window.innerWidth || Math.abs(moonY) > window.innerHeight) ? 'hidden' : 'visible'
                }}
            >
                <div className={`relative w-full h-full transition-all duration-300 ${moonVisible ? 'brightness-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'brightness-50 opacity-40'}`}>
                    {/* Scale 110% to crop out potential black borders if mask is loose */}
                    <img src="/moon.png" alt="Moon" className="w-full h-full object-cover scale-110" />

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
