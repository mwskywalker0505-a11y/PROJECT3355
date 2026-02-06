import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { ASSETS } from '../constants';
import { audioManager } from '../utils/AudioManager';

// Shortest distance between two angles (degrees)
const getAngleDistance = (target, current) => {
    let diff = target - current;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    return diff;
};

const HIT_TOLERANCE = 8; // Degrees

export default function SearchPhase({ onFound }) {
    // Current device orientation
    const [orientation, setOrientation] = useState({ alpha: 0, beta: 90, gamma: 0 });

    // Multi-Planet State
    const [planets, setPlanets] = useState([]);
    const [calibrated, setCalibrated] = useState(false);

    // Active Target Logic
    const [activeTarget, setActiveTarget] = useState(null); // The planet currently being tracked
    const [distance, setDistance] = useState(100);
    const [arrowAngle, setArrowAngle] = useState(0);

    // Landing sequence state
    const [landingTarget, setLandingTarget] = useState(null); // The planet getting "Land on"
    const [popupMessage, setPopupMessage] = useState(null); // "DATA ACQUIRED" etc

    // Shooting Star State
    const [shootingStar, setShootingStar] = useState(null);

    useEffect(() => {
        const handleOrientation = (event) => {
            const alpha = event.alpha || 0;
            const beta = event.beta || 90;
            const gamma = event.gamma || 0;

            const newOrientation = { alpha, beta, gamma };
            setOrientation(newOrientation);

            // INITIALIZATION: Spawn Planets relative to user's starting position
            if (!calibrated && event.alpha !== null) {
                setCalibrated(true);

                // Helper to check overlap
                const isOverlapping = (newAlpha, newBeta, existingPlanets) => {
                    return existingPlanets.some(p => {
                        const dAlpha = getAngleDistance(newAlpha, p.alpha);
                        const dBeta = newBeta - p.beta;
                        const dist = Math.sqrt(dAlpha * dAlpha + dBeta * dBeta);
                        return dist < 60; // Minimum 60 deg separation
                    });
                };

                const newPlanets = [];
                const planetDefs = [
                    { id: 'moon', type: 'TARGET', name: 'MOON', asset: ASSETS.MOON },
                    { id: 'mars', type: 'DISCOVERY', name: 'MARS', asset: ASSETS.MARS },
                    { id: 'mercury', type: 'DISCOVERY', name: 'MERCURY', asset: ASSETS.MERCURY },
                    { id: 'saturn', type: 'DISCOVERY', name: 'SATURN', asset: ASSETS.SATURN }
                ];

                planetDefs.forEach(def => {
                    let pAlpha, pBeta, attempts = 0;
                    do {
                        // Random offset relative to user start (Alpha)
                        // Range: Full 360 around user, but ensure spread
                        pAlpha = (alpha + (Math.random() * 300 + 30)) % 360;
                        // Beta: Keep somewhat central horizon (-20 to 60 relative to 90)
                        pBeta = Math.min(130, Math.max(50, beta + (Math.random() * 80 - 40)));
                        attempts++;
                    } while (isOverlapping(pAlpha, pBeta, newPlanets) && attempts < 20);

                    newPlanets.push({
                        ...def,
                        alpha: pAlpha,
                        beta: pBeta,
                        visited: false
                    });
                });

                setPlanets(newPlanets);
            }

            // AUTO-LOCK RADAR LOGIC
            // Find closest unvisited planet
            if (planets.length > 0 && !landingTarget) {
                let minDist = 9999;
                let closest = null;

                planets.forEach(p => {
                    if (p.visited) return;

                    const dAlpha = getAngleDistance(p.alpha, alpha);
                    const dBeta = p.beta - beta;
                    const dist = Math.sqrt(dAlpha * dAlpha + dBeta * dBeta);

                    if (dist < minDist) {
                        minDist = dist;
                        closest = p;
                    }
                });

                if (closest) {
                    setActiveTarget(closest);
                    setDistance(minDist);

                    // Update Arrow
                    const dAlpha = getAngleDistance(closest.alpha, alpha);
                    const dBeta = closest.beta - beta;
                    const vecX = -dAlpha;
                    const vecY = -dBeta;
                    const rad = Math.atan2(vecY, vecX);
                    setArrowAngle((rad * 180 / Math.PI) + 90);
                }
            }
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [planets, calibrated, landingTarget]);

    // Shooting Star Logic (Comet Style) - Preserved
    const COMET_COLORS = [
        { head: 'rgba(255,255,255,0.9)', tail: 'from-transparent via-white/50 to-white' },
        { head: 'rgba(51,255,0,0.9)', tail: 'from-transparent via-[#33ff00]/50 to-[#33ff00]' },
        { head: 'rgba(0,255,255,0.9)', tail: 'from-transparent via-[#00ffff]/50 to-[#00ffff]' },
        { head: 'rgba(255,204,0,0.9)', tail: 'from-transparent via-[#ffcc00]/50 to-[#ffcc00]' }
    ];

    useEffect(() => {
        let timeout;
        const scheduleStar = () => {
            const delay = 4000 + Math.random() * 6000;
            timeout = setTimeout(() => { triggerStar(); scheduleStar(); }, delay);
        };
        const triggerStar = () => {
            const color = COMET_COLORS[Math.floor(Math.random() * COMET_COLORS.length)];
            setShootingStar({
                id: Date.now(),
                top: Math.random() * 60 + '%', left: Math.random() * 80 + '%',
                scale: 0.8 + Math.random() * 0.5, color: color
            });
            setTimeout(() => setShootingStar(null), 3000);
        };
        scheduleStar();
        return () => clearTimeout(timeout);
    }, []);


    // LOCK & LANDING LOGIC
    const targetVisible = distance < HIT_TOLERANCE * 1.5;

    // Audio Loop for Radar
    useEffect(() => {
        let interval;
        if (targetVisible && !landingTarget) {
            audioManager.play(ASSETS.SE_KEIKOKU);
            interval = setInterval(() => { audioManager.play(ASSETS.SE_KEIKOKU); }, 400);
        }
        return () => clearInterval(interval);
    }, [targetVisible, landingTarget]);

    const handleLockComplete = () => {
        if (!activeTarget || landingTarget) return;

        // Trigger Landing Sequence
        setLandingTarget(activeTarget);
        audioManager.play(ASSETS.SE_POPUP);

        // Outcome Handling
        setTimeout(() => {
            if (activeTarget.type === 'TARGET') {
                // VICTORY: Moon Found
                onFound();
            } else {
                // DISCOVERY: Other Planet
                setPopupMessage(`DATA ACQUIRED: ${activeTarget.name}`);

                // Reset after delay
                setTimeout(() => {
                    setPlanets(prev => prev.map(p =>
                        p.id === activeTarget.id ? { ...p, visited: true } : p
                    ));
                    setLandingTarget(null);
                    setPopupMessage(null);
                }, 3000);
            }
        }, 1500); // Wait for zoom animation
    };

    if (!calibrated) return <div className="w-full h-full bg-black text-terminal-green flex items-center justify-center font-mono">INITIALIZING SENSORS...</div>;

    // Background Parallax (Sine Wave)
    const bgX = Math.sin(orientation.alpha * (Math.PI / 180)) * 80;
    const bgY = Math.sin((orientation.beta - 90) * (Math.PI / 180)) * 80;

    return (
        <div className="relative w-full h-full overflow-hidden bg-black transition-all duration-1000 ease-out">
            {/* STATIC BACKGROUND IMAGE (Parallax) */}
            <div
                className={`absolute inset-[-50%] w-[200%] h-[200%] z-0 transition-opacity duration-1000 ${landingTarget ? 'opacity-0' : 'opacity-60'}`}
                style={{
                    backgroundImage: `url(${ASSETS.NASA_BG})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transition: 'none', // Parallax instant update
                    transform: `translate3d(${bgX}px, ${bgY}px, 0)`
                }}
            />

            {/* Instruction Message */}
            {!landingTarget && (
                <div className="absolute top-20 left-0 w-full text-center z-50 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="bg-black/50 backdrop-blur-sm py-2 px-6 inline-block rounded-full border border-terminal-green/30"
                    >
                        <p className={`font-mono text-sm tracking-widest animate-pulse ${activeTarget?.type === 'TARGET' ? 'text-amber-500' : 'text-cyan-400'
                            }`}>
                            {activeTarget?.type === 'TARGET' ? `TARGET ID: 0303` : 'UNKNOWN SIGNAL'}
                        </p>
                        <p className="text-white text-xs mt-1 font-sans">
                            {activeTarget?.type === 'TARGET' ? '月を捕捉してください' : '未確認信号を調査中...'}
                        </p>
                    </motion.div>
                </div>
            )}

            {/* Arrow Guide */}
            {!landingTarget && distance > 25 && (
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60] transition-opacity duration-500"
                    style={{ opacity: Math.min(1, Math.max(0, (distance - 20) / 20)) }}
                >
                    <motion.div
                        className={`w-24 h-24 rounded-full border-2 flex items-center justify-center 
                            ${activeTarget?.type === 'TARGET' ? 'border-amber-500 shadow-[0_0_20px_#ffcc00]' : 'border-cyan-400 shadow-[0_0_20px_#00ffff]'}`}
                        animate={{ rotate: arrowAngle }}
                        transition={{ type: "spring", stiffness: 40, damping: 10 }}
                    >
                        <ChevronUp
                            className={`w-10 h-10 animate-bounce-slow drop-shadow-[0_0_10px_currentColor] 
                            ${activeTarget?.type === 'TARGET' ? 'text-amber-500' : 'text-cyan-400'}`}
                            strokeWidth={2.5}
                        />
                    </motion.div>
                </div>
            )}

            {/* Shooting Stars */}
            <AnimatePresence>
                {shootingStar && !landingTarget && (
                    <motion.div
                        initial={{ opacity: 0, translateX: 0, translateY: 0, scale: shootingStar.scale }}
                        animate={{ opacity: [0, 1, 1, 0], translateX: 400, translateY: 200 }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                        className="absolute z-10 pointer-events-none"
                        style={{ top: shootingStar.top, left: shootingStar.left, rotate: '25deg' }}
                    >
                        <div className="absolute w-2 h-2 bg-white rounded-full" style={{ boxShadow: `0 0 15px 4px ${shootingStar.color.head}` }} />
                        <div className={`absolute top-1/2 right-full w-[200px] h-[2px] bg-gradient-to-r ${shootingStar.color.tail} -translate-y-1/2 origin-right`} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PLANETS RENDERING */}
            {planets.map(planet => {
                if (planet.visited) return null; // Hide visited

                // Calculate Position on Screen
                const SCALE = 15;
                const dAlpha = getAngleDistance(planet.alpha, orientation.alpha);
                const dBeta = planet.beta - orientation.beta;
                const pX = -dAlpha * SCALE;
                const pY = -dBeta * SCALE;

                // Visibility Check (Performance)
                const isVisible = Math.abs(pX) <= window.innerWidth && Math.abs(pY) <= window.innerHeight;

                // Landing Animation Override
                const isLanding = landingTarget?.id === planet.id;

                return (
                    <div
                        key={planet.id}
                        className="absolute top-1/2 left-1/2 w-64 h-64 -ml-32 -mt-32 rounded-full cursor-none will-change-transform"
                        style={{
                            transform: `translate3d(${pX}px, ${pY}px, 0)`,
                            visibility: (isVisible || isLanding) ? 'visible' : 'hidden',
                            zIndex: isLanding ? 100 : 10
                        }}
                    >
                        <motion.div
                            className={`relative w-full h-full rounded-full overflow-hidden
                                ${targetVisible && activeTarget?.id === planet.id && !landingTarget ? 'brightness-125 drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]' : 'brightness-75 opacity-80'}
                            `}
                            animate={isLanding ? { scale: 20, opacity: 0 } : { scale: 1, opacity: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        >
                            <img
                                src={planet.asset}
                                alt={planet.name}
                                className="w-full h-full object-cover mix-blend-screen"
                            />

                            {/* LOCKING RING */}
                            {targetVisible && activeTarget?.id === planet.id && !landingTarget && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-80 h-80 animate-spin-slow opacity-80" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="48" fill="none"
                                            stroke={planet.type === 'TARGET' ? '#ffcc00' : '#00ffff'}
                                            strokeWidth="0.5" strokeDasharray="4 2"
                                        />
                                    </svg>
                                    <div className="absolute top-full mt-4 text-xs font-mono tracking-widest text-center"
                                        style={{ color: planet.type === 'TARGET' ? '#ffcc00' : '#00ffff' }}>
                                        {planet.type === 'TARGET' ? 'LOCKING TARGET...' : 'ANALYZING...'}
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 3.0, ease: "linear" }}
                                            onAnimationComplete={handleLockComplete}
                                            className="h-1 mt-1"
                                            style={{ backgroundColor: planet.type === 'TARGET' ? '#ffcc00' : '#00ffff' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                );
            })}

            {/* POPUP OVERLAY for DISCOVERY */}
            <AnimatePresence>
                {popupMessage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80"
                    >
                        <div className="border border-cyan-500 bg-black/90 p-8 rounded text-center shadow-[0_0_50px_rgba(0,255,255,0.3)]">
                            <h2 className="text-3xl font-bold text-cyan-400 mb-2 font-mono tracking-widest">
                                SCAN COMPLETE
                            </h2>
                            <p className="text-white font-sans text-xl">{popupMessage}</p>
                            <p className="text-cyan-600 text-sm mt-4 animate-pulse">RESUMING SEARCH...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Crosshair */}
            {!landingTarget && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="w-8 h-8 border border-white/30" />
                    <div className="absolute w-12 h-[1px] bg-white/30" />
                    <div className="absolute h-12 w-[1px] bg-white/30" />
                </div>
            )}
        </div >
    );
}
