import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { ASSETS, PLANET_INFO } from '../constants';
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
    const [landingTarget, setLandingTarget] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);

    // Animation States
    const [isShaking, setIsShaking] = useState(false);
    const [whiteoutOpacity, setWhiteoutOpacity] = useState(0);

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
                    { id: 'moon', type: 'TARGET', name: 'MOON', asset: ASSETS.MOON, lockText: 'LOCKING TARGET...' },
                    { id: 'mars', type: 'DISCOVERY', name: 'MARS', asset: ASSETS.MARS, lockText: 'ANALYZING RED SOIL...' },
                    { id: 'mercury', type: 'DISCOVERY', name: 'MERCURY', asset: ASSETS.MERCURY, lockText: 'THERMAL SCANNING...' },
                    { id: 'saturn', type: 'DISCOVERY', name: 'SATURN', asset: ASSETS.SATURN, lockText: 'RING SPECTROSCOPY...' }
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
            if (planets.length > 0 && !landingTarget) {
                let minDist = 9999;
                let closest = null;

                planets.forEach(p => {
                    if (p.visited) return;
                    const dAlpha = getAngleDistance(p.alpha, alpha);
                    const dBeta = p.beta - beta;
                    const dist = Math.sqrt(dAlpha * dAlpha + dBeta * dBeta);
                    if (dist < minDist) { minDist = dist; closest = p; }
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

    // Shooting Star Logic
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

    // Handle Lock & Display Details
    // SEQUENCE: Lock -> Glitch(0.5s) -> Show Details -> Wait for User Input
    const handleLockComplete = () => {
        if (!activeTarget || landingTarget) return;

        // 1. START SEQUENCE
        audioManager.play(ASSETS.SE_POPUP);
        setIsShaking(true);
        setWhiteoutOpacity(1); // Immediate Whiteout/Glitch start

        // 2. SHOW DETAILS (at 0.5s)
        setTimeout(() => {
            setLandingTarget(activeTarget);
            setIsShaking(false);
            setWhiteoutOpacity(0);

            // Set message
            if (activeTarget.type === 'TARGET') {
                // For Moon, we might still want to auto-proceed or show details then proceed?
                // Current logic: Show details for Moon too or just win?
                // User request implies "Return to space" for others.
                // Let's assume Moon also shows details then user taps to proceed to CLIMAX?
                // Or keep auto-win for Moon?
                // "Reset found state (if target was NOT Moon)." implies Moon is special.
                // Let's keep Moon auto-win behaviors or special check.
                // BUT, user said "Locate Moon vs 3 Decoys" and "Moon -> Success".
                // Let's show the UI for Moon too, but clicking it triggers onFound().
                const info = PLANET_INFO[activeTarget.id.toUpperCase()];
                setPopupMessage(info || { name: 'THE MOON', type: 'TARGET', desc: 'Target acquired.' });
            } else {
                const info = PLANET_INFO[activeTarget.id.toUpperCase()];
                setPopupMessage(info || `DATA ACQUIRED: ${activeTarget.name}`);
            }
        }, 500);
    };

    // TTS Logic
    useEffect(() => {
        if (popupMessage && typeof popupMessage === 'object') {
            // Cancel any previous speech
            window.speechSynthesis.cancel();

            const speak = () => {
                const utterance = new SpeechSynthesisUtterance();
                utterance.text = popupMessage.name.split('(')[0] + "。" + popupMessage.desc; // Read Name + Desc
                utterance.lang = 'ja-JP';
                utterance.rate = 1.1;
                utterance.pitch = 1.0;

                // Smart Voice Selection: Prioritize high-quality voices
                const voices = window.speechSynthesis.getVoices();

                // Try to find specific high-quality Japanese voices first
                let selectedVoice = voices.find(v =>
                    v.lang.includes('ja') && (
                        v.name.includes('Google') ||  // Android/Chrome High Quality
                        v.name.includes('Siri') ||    // iOS High Quality
                        v.name.includes('Kyoko') ||   // iOS Classic
                        v.name.includes('Otoya')      // iOS Classic
                    )
                );

                // Fallback to any Japanese voice
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => v.lang.includes('ja') || v.name.includes('Japan'));
                }

                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }

                window.speechSynthesis.speak(utterance);
            };

            // Handle async voice loading (Chrome/Android)
            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.onvoiceschanged = speak;
            } else {
                speak();
            }
        }
    }, [popupMessage]);

    // Handle User Tap on Details
    const handleDismiss = () => {
        if (!popupMessage) return;

        window.speechSynthesis.cancel(); // STOP SPEECH
        audioManager.play(ASSETS.SE_TOUCH, false, 3.0);

        // 1. GLITCH OUT
        setIsShaking(true);
        setWhiteoutOpacity(1);

        // 2. RESET OR WIN (at 0.5s)
        setTimeout(() => {
            setIsShaking(false);
            setWhiteoutOpacity(0);
            setPopupMessage(null);
            setLandingTarget(null);

            if (activeTarget?.type === 'TARGET') {
                onFound(); // VICTORY
            } else {
                // RESET visited status for decys? 
                // User said "Reset found state (if target was NOT Moon)".
                // Actually "Mark visited" was previous logic.
                // "Reset found state" usually means un-find it? Or just reset the *view*?
                // "Data Acquired -> Reset position (Mark visited)" was previous plan.
                // User request: "Reset found state (if target was NOT Moon)."
                // If we un-visit it, we can find it again. Let's assume "Resume Mission" matches existing "Mark visited" logic 
                // so we don't endless loop finding same planet if we don't move.
                // BUT user said "Reset found state". Maybe they mean "Reset UI state"?
                // I will keep "Mark Visited" as true so it disappears from radar (standard game logic).
                setPlanets(prev => prev.map(p =>
                    p.id === activeTarget.id ? { ...p, visited: true } : p
                ));
            }
        }, 500);
    };

    if (!calibrated) return <div className="w-full h-full bg-black text-terminal-green flex items-center justify-center font-mono">INITIALIZING SENSORS...</div>;

    // Background Parallax (Sine Wave)
    const bgX = Math.sin(orientation.alpha * (Math.PI / 180)) * 80;
    const bgY = Math.sin((orientation.beta - 90) * (Math.PI / 180)) * 80;

    return (
        <div className="relative w-full h-full overflow-hidden bg-black transition-all duration-1000 ease-out">
            {/* SCREEN SHAKE WRAPPER */}
            <motion.div
                className="w-full h-full relative"
                animate={isShaking ? {
                    x: [0, -5, 5, -5, 5, 0],
                    y: [0, 5, -5, 5, -5, 0],
                    filter: ["blur(0px)", "blur(4px)", "blur(0px)"]
                } : { x: 0, y: 0, filter: "blur(0px)" }}
                transition={isShaking ? { repeat: Infinity, duration: 0.1 } : { duration: 0.5 }}
            >
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

                    // Landing View: Just show it normally or hidden?
                    // User said "Landing View: Show Surface Image".
                    // If we remove scale animation, it just stays there.
                    // But if we want a "Landing View", maybe we should just center it?
                    // "Remove Zoom Animation... Delete any logic that scales up... trigger Glitch... Landing View: Show Surface Image"
                    // If we don't scale up, it might look small.
                    // Let's force it to be centered and slightly larger (but not zooming IN) during landing?
                    // Or maybe uses a static "Detail View" image?
                    // Assuming we keep the planet visible.
                    const isLanding = landingTarget?.id === planet.id;

                    if (isLanding) {
                        // FORCE CENTERED & LARGE for analysis view
                        return (
                            <div
                                key={planet.id}
                                className="absolute inset-0 flex items-center justify-center z-[50]"
                            >
                                <motion.div
                                    className="relative w-80 h-80 rounded-full overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.5)]"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <img
                                        src={planet.asset}
                                        alt={planet.name}
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={planet.id}
                            className="absolute top-1/2 left-1/2 w-64 h-64 -ml-32 -mt-32 rounded-full cursor-none will-change-transform"
                            style={{
                                transform: `translate3d(${pX}px, ${pY}px, 0)`,
                                visibility: isVisible ? 'visible' : 'hidden',
                                zIndex: 10
                            }}
                        >
                            <div
                                className={`relative w-full h-full rounded-full overflow-hidden transition-all duration-300
                                    ${targetVisible && activeTarget?.id === planet.id && !landingTarget ? 'drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] opacity-100' : 'opacity-90'}
                                `}
                            >
                                <img
                                    src={planet.asset}
                                    alt={planet.name}
                                    className="w-full h-full object-cover mix-blend-screen"
                                />
                            </div>

                            {/* LOCKING RING & UI */}
                            {targetVisible && activeTarget?.id === planet.id && !landingTarget && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <svg className="w-80 h-80 animate-spin-slow opacity-80" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="48" fill="none"
                                            stroke={planet.type === 'TARGET' ? '#ffcc00' : '#00ffff'}
                                            strokeWidth="0.5" strokeDasharray="4 2"
                                        />
                                    </svg>

                                    <div className="absolute top-full mt-8 text-xs font-mono tracking-widest text-center whitespace-nowrap"
                                        style={{ color: planet.type === 'TARGET' ? '#ffcc00' : '#00ffff' }}>
                                        {planet.lockText || 'ANALYZING...'}
                                        <div className="w-48 h-1 bg-gray-800 mt-2 mx-auto overflow-hidden rounded-full">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 3.0, ease: "linear" }}
                                                onAnimationComplete={handleLockComplete}
                                                className="h-full"
                                                style={{ backgroundColor: planet.type === 'TARGET' ? '#ffcc00' : '#00ffff' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Crosshair */}
                {!landingTarget && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <div className="w-8 h-8 border border-white/30" />
                        <div className="absolute w-12 h-[1px] bg-white/30" />
                        <div className="absolute h-12 w-[1px] bg-white/30" />
                    </div>
                )}
            </motion.div>

            {/* WHITEOUT OVERLAY */}
            <div
                className="absolute inset-0 bg-white z-[150] pointer-events-none transition-opacity duration-200 ease-in-out mix-blend-overlay"
                style={{ opacity: whiteoutOpacity }}
            />

            {/* POPUP OVERLAY for DISCOVERY */}
            <AnimatePresence>
                {popupMessage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 cursor-pointer"
                        onClick={handleDismiss} // CLICK TO DISMISS
                    >
                        {typeof popupMessage === 'object' ? (
                            <div className="border border-terminal-green bg-black/90 p-6 max-w-md w-full shadow-[0_0_30px_rgba(51,255,0,0.2)] relative overflow-hidden pointer-events-none">
                                {/* Scanline Effect */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-end border-b border-terminal-green/50 pb-2 mb-4">
                                        <h2 className="text-3xl font-bold tracking-widest text-terminal-green font-mono">
                                            {popupMessage.name}
                                        </h2>
                                        <span className="text-xs text-terminal-green/70 font-mono mb-1">{popupMessage.type}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-xs mb-6 font-mono text-terminal-green">
                                        <div className="border-l-2 border-terminal-green/30 pl-3">
                                            <span className="opacity-50 block mb-1">GRAVITY</span>
                                            {popupMessage.gravity}
                                        </div>
                                        <div className="border-l-2 border-terminal-green/30 pl-3">
                                            <span className="opacity-50 block mb-1">TEMP</span>
                                            {popupMessage.temp}
                                        </div>
                                        <div className="col-span-2 border-l-2 border-terminal-green/30 pl-3">
                                            <span className="opacity-50 block mb-1">ATMOSPHERE</span>
                                            {popupMessage.atmosphere}
                                        </div>
                                    </div>

                                    <p className="text-sm text-terminal-green/90 border-t border-terminal-green/50 pt-3 font-mono leading-relaxed">
                                        &gt;&gt; {popupMessage.desc}
                                    </p>

                                    <div className="mt-8 flex justify-center">
                                        <p className="text-terminal-green text-sm animate-pulse border border-terminal-green/50 px-4 py-1 rounded">
                                            &gt;&gt; 画面をタップして探索を再開 &lt;&lt;
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Fallback for simple strings (Safety)
                            <div className="border border-cyan-500 bg-black/90 p-8 rounded text-center shadow-[0_0_50px_rgba(0,255,255,0.3)] pointer-events-none">
                                <h2 className="text-3xl font-bold text-cyan-400 mb-2 font-mono tracking-widest">
                                    SCAN COMPLETE
                                </h2>
                                <p className="text-white font-sans text-xl">{popupMessage}</p>
                                <p className="text-cyan-600 text-sm mt-4 animate-pulse">&gt;&gt; 画面をタップして探索を再開 &lt;&lt;</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
