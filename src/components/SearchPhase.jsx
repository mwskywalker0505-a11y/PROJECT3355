import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Moon position in degrees (Target)
// Assuming "upright" holding position is Beta ~90, Gamma ~0
// Target: Slightly up (lower beta) and right (positive gamma)
// Or customize as needed. Let's make it challenging but findable.
const TARGET_POSITION = { beta: 60, gamma: 20 };
const HIT_TOLERANCE = 15; // Degrees of tolerance

export default function SearchPhase({ onFound }) {
    const [orientation, setOrientation] = useState({ beta: 90, gamma: 0 });
    const [found, setFound] = useState(false);

    const layer1Ref = useRef(null);
    const layer2Ref = useRef(null);
    const layer3Ref = useRef(null);

    useEffect(() => {
        const handleOrientation = (event) => {
            // Basic clamping and defaults
            const beta = event.beta || 90;
            const gamma = event.gamma || 0;
            setOrientation({ beta, gamma });
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    // Check if target is in view (for hit testing)
    // We can also let the user "tap" the moon only when it's visible
    const moonVisible =
        Math.abs(orientation.beta - TARGET_POSITION.beta) < HIT_TOLERANCE &&
        Math.abs(orientation.gamma - TARGET_POSITION.gamma) < HIT_TOLERANCE;

    const handleLockComplete = () => {
        if (!found) {
            setFound(true);
            onFound();
        }
    };

    // Parallax calculations
    // We move the background OPPOSITE to the device movement to simulate a window
    // Center point: beta 90, gamma 0
    const deltaBeta = orientation.beta - 90;
    const deltaGamma = orientation.gamma;

    // Multipliers for layers (Near moves more, Far moves less)
    const p1 = { x: deltaGamma * 2, y: deltaBeta * 2 }; // Far
    const p2 = { x: deltaGamma * 5, y: deltaBeta * 5 }; // Mid
    const p3 = { x: deltaGamma * 10, y: deltaBeta * 10 }; // Near

    // Moon position on screen relative to center
    // If device is looking at (90, 0), Moon is at offset based on difference
    // Moon is at (TARGET - CURRENT) * scale
    const moonX = (TARGET_POSITION.gamma - orientation.gamma) * 15; // 15px per degree
    const moonY = (orientation.beta - TARGET_POSITION.beta) * 15; // inverted Y because beta decreases as you go "up" (tilt forward) - wait, tilting phone forward (top away) decreases beta.
    // Actually, standard Euler angles:
    // Upright: Beta=90. Tilted back (screen up): Beta=180. Tilted forward (screen down): Beta=0.
    // So to look "up" into the sky, you tilt back? Or lift the phone?
    // Let's assume "Window" metaphor. If I tilt phone UP (look up), Beta INCREASES?
    // No, if I hold phone upright (90) and tilt top back, Beta goes > 90.
    // If I tilt top forward, Beta goes < 90.
    // Let's assume Target is "Up" in the sky. So Beta should be > 90? Or just arbitrary.
    // Let's stick to the coordinates: Target is at Beta=60 (Tilt forward/down? Or maybe user is lying down?)
    // Let's stick to X/Y logic:
    // Moon screen position = Center + (TargetAngle - CurrentAngle) * Scale

    // Note: Star generation could be improved with random utility, keeping it fixed for simplicity or inline

    return (
        <div className="relative w-full h-full overflow-hidden bg-black transition-all duration-1000 ease-out">
            {/* Background - Far Stars */}
            <div
                className="absolute inset-[-50vmax] opacity-40 transition-transform duration-100 linear will-change-transform"
                style={{ transform: `translate3d(${-p1.x}px, ${p1.y}px, 0)` }}
            >
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-repeat" />
                {/* Fallback to simple stars if image fails, using CSS gradients or box-shadows is better usually but sticking to prompt assets/style */}
                {/* Generating random stars with box-shadow in CSS would be cleaner but complex to inline. 
            Let's use a simpler approach: multiple divs with different scatter */}
                {[...Array(20)].map((_, i) => (
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
                className="absolute inset-[-50vmax] opacity-60 transition-transform duration-100 linear will-change-transform"
                style={{ transform: `translate3d(${-p2.x}px, ${p2.y}px, 0)` }}
            >
                {[...Array(15)].map((_, i) => (
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
                className="absolute inset-[-50vmax] opacity-80 transition-transform duration-100 linear will-change-transform"
                style={{ transform: `translate3d(${-p3.x}px, ${p3.y}px, 0)` }}
            >
                {[...Array(10)].map((_, i) => (
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
                className="absolute top-1/2 left-1/2 w-48 h-48 -ml-24 -mt-24 rounded-full cursor-none transition-transform duration-100 linear will-change-transform group"
                style={{
                    transform: `translate3d(${moonX}px, ${moonY}px, 0)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Moon Visual - Asset */}
                <div className={`relative w-full h-full transition-all duration-300 ${moonVisible ? 'brightness-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'brightness-50 opacity-40'}`}>
                    <img src="/moon.png" alt="Moon" className="w-full h-full object-contain" />

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

            {/* Orientation Debug (Optional, remove in prod or keep for sci-fi feel) */}
            <div className="absolute bottom-4 left-4 text-[10px] text-terminal-green/40 font-mono">
                B: {orientation.beta?.toFixed(0)} G: {orientation.gamma?.toFixed(0)}
                <br />
                T_B: {TARGET_POSITION.beta} T_G: {TARGET_POSITION.gamma}
            </div>
        </div>
    );
}
