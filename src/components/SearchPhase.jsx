import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Activity } from 'lucide-react';
import { ASSETS, PLANET_INFO } from '../constants';
import { audioManager } from '../utils/AudioManager';

// Shortest distance between two angles (degrees)
const getAngleDistance = (target, current) => {
    let diff = target - current;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    return diff;
};

const HIT_TOLERANCE = 10; // Degrees

// Helper Component for Typewriter Effect
const TypewriterText = ({ text, speed = 100 }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                audioManager.play(ASSETS.SE_TYPEWRITER, false, 0.5); // Play Typewriter Sound
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return <span>{displayedText}</span>;
};

export default function SearchPhase({ onFound }) {
    // --- STATE ---
    const [orientation, setOrientation] = useState({ alpha: 0, beta: 90, gamma: 0 });
    const [calibrated, setCalibrated] = useState(false);
    const [calibrationOffset, setCalibrationOffset] = useState(0);

    const [planets, setPlanets] = useState([]);
    const [activeTarget, setActiveTarget] = useState(null);
    const [distance, setDistance] = useState(null);
    const [arrowAngle, setArrowAngle] = useState(0);
    const [targetVisible, setTargetVisible] = useState(false);

    const [landingTarget, setLandingTarget] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [isShaking, setIsShaking] = useState(false);
    const [whiteoutOpacity, setWhiteoutOpacity] = useState(0);

    const [shootingStar, setShootingStar] = useState(null);
    const [isEmergency, setIsEmergency] = useState(false);

    const emergencyAudioRef = useRef(null);
    const emergencyTriggeredRef = useRef(false);
    const heartbeatAudioRef = useRef(null);

    // --- EFFECTS ---

    // 1. Initialize Planets & Audio
    useEffect(() => {
        // Initial Planets
        // Randomize Moon Position so it's not always in front
        const moonAlpha = Math.random() * 360;

        const initialPlanets = [
            { id: 'moon', type: 'TARGET', name: 'THE MOON', asset: ASSETS.MOON, alpha: moonAlpha, beta: 60, visited: false, lockText: 'ANALYZING...' }
        ];

        // Decoys
        const decoys = [
            { id: 'mars', type: 'PLANET', name: 'MARS', asset: ASSETS.MARS },
            { id: 'mercury', type: 'PLANET', name: 'MERCURY', asset: ASSETS.MERCURY },
            { id: 'saturn', type: 'PLANET', name: 'SATURN', asset: ASSETS.SATURN }
        ];

        // Randomize Decoys
        decoys.forEach((d, i) => {
            // Distribute relative to Moon or Random?
            // Let's just randomize broadly but ensure they aren't TOO close to Moon if possible, 
            // but simple random is probably fine for now.
            const angleOffset = (Math.random() * 360);
            const betaPos = 40 + Math.random() * 50;
            initialPlanets.push({
                ...d,
                alpha: angleOffset,
                beta: betaPos,
                visited: false,
                lockText: 'SCANNING...'
            });
        });

        setPlanets(initialPlanets);
        audioManager.play(ASSETS.BGM_MOON_SEARCH, true, 0.4);

        return () => {
            audioManager.stop(ASSETS.BGM_MOON_SEARCH);
            audioManager.stop(ASSETS.SE_KEIKOKU); // Ensure lock sound stops
            if (emergencyAudioRef.current) clearInterval(emergencyAudioRef.current);
        };
    }, []);

    // Play SE_KEIKOKU Loop when target is locked (Visible)
    useEffect(() => {
        if (targetVisible && !landingTarget) {
            // Start Looping
            audioManager.play(ASSETS.SE_KEIKOKU, true);
        } else {
            // Stop Looping
            audioManager.stop(ASSETS.SE_KEIKOKU);
        }
    }, [targetVisible, landingTarget]);

    // 2. Device Orientation
    useEffect(() => {
        const handleOrientation = (e) => {
            if (e.alpha === null) return;

            // Initial Calibration
            if (!calibrated) {
                setCalibrationOffset(e.alpha);
                setCalibrated(true);
            }

            let adjAlpha = e.alpha - calibrationOffset;
            if (adjAlpha < 0) adjAlpha += 360;

            setOrientation({
                alpha: adjAlpha,
                beta: e.beta,
                gamma: e.gamma
            });
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [calibrated, calibrationOffset]);

    // 3. Radar & Locking Logic
    useEffect(() => {
        if (!calibrated || landingTarget) return;

        let closest = null;
        let minDist = Infinity;

        planets.forEach(p => {
            if (p.visited) return;
            // Diff calculation
            const da = getAngleDistance(p.alpha, orientation.alpha);
            const db = getAngleDistance(p.beta, orientation.beta);
            const d = Math.sqrt(da * da + db * db);

            if (d < minDist) {
                minDist = d;
                closest = p;
            }
        });

        setActiveTarget(closest);
        setDistance(minDist);

        if (closest) {
            // Calc Arrow Angle
            const da = getAngleDistance(closest.alpha, orientation.alpha);
            const db = getAngleDistance(closest.beta, orientation.beta);
            // atan2(y, x) -> here x=da, y=db (screen space mapping is tricky, but standard is alpha=x, beta=y)
            // Actually, alpha is horizontal (yaw), beta is vertical (pitch).
            // We want arrow pointing to target.
            // visual X diff = -da * scale. visual Y diff = -db * scale.
            // angle = atan2(py, px)
            // But for arrow rotation:
            // 0 deg is UP.
            // If planet is "Right" (-da < 0), arrow should point Right (90).
            // Logic:
            const angle = Math.atan2(da, db) * (180 / Math.PI);
            setArrowAngle(-angle);

            setTargetVisible(minDist < HIT_TOLERANCE);
        }

    }, [orientation, planets, calibrated, landingTarget]);

    // 4. Shooting Stars
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) return;
            setShootingStar({
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
                scale: 0.5 + Math.random(),
                color: Math.random() > 0.5
                    ? { head: 'rgba(200,255,255,0.8)', tail: 'rgba(0,255,255,0)' }
                    : { head: 'rgba(255,200,200,0.8)', tail: 'rgba(255,50,50,0)' }
            });
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // 5. TTS for Popup
    useEffect(() => {
        if (popupMessage && typeof popupMessage === 'object') {
            window.speechSynthesis.cancel();

            const speak = () => {
                const utterance = new SpeechSynthesisUtterance();
                const nameToRead = popupMessage.rawName || popupMessage.name;
                const textName = typeof nameToRead === 'string' ? nameToRead : 'UNKNOWN';

                utterance.text = textName.split('(')[0] + "。" + popupMessage.desc;
                utterance.lang = 'ja-JP';
                utterance.rate = 1.1;
                utterance.pitch = 1.0;

                const voices = window.speechSynthesis.getVoices();
                let selectedVoice = voices.find(v =>
                    v.lang.includes('ja') && (
                        v.name.includes('Google') || v.name.includes('Siri') || v.name.includes('Kyoko')
                    )
                ) || voices.find(v => v.lang.includes('ja'));

                if (selectedVoice) utterance.voice = selectedVoice;
                window.speechSynthesis.speak(utterance);
            };

            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.onvoiceschanged = speak;
            } else {
                speak();
            }
        }
    }, [popupMessage]);

    // Heartbeat & TTS Control
    // (Heartbeat logic moved to ClimaxPhase)
    useEffect(() => {
        // No heartbeat here anymore
    }, [popupMessage]);


    // --- ACTIONS ---

    const handleLockComplete = () => {
        if (!activeTarget || landingTarget) return;

        // 1. START SEQUENCE
        audioManager.play(ASSETS.SE_POPUP);
        setIsShaking(true);
        setWhiteoutOpacity(1);

        // 2. SHOW DETAILS (at 0.5s)
        setTimeout(() => {
            setLandingTarget(activeTarget);
            setIsShaking(false);
            setWhiteoutOpacity(0);

            // Set message
            if (activeTarget.id === 'astronaut') {
                setPopupMessage({
                    name: <TypewriterText text="MICHIHO WAKAIZUMI" speed={150} />,
                    rawName: 'MICHIHO WAKAIZUMI',
                    type: 'LIFEFORM',
                    desc: '生体反応を検出。これは...',
                    gravity: '---',
                    temp: '36.5°C',
                    atmosphere: 'O2 (21%)'
                });
            } else if (activeTarget.type === 'TARGET') {
                // MOON
                const info = PLANET_INFO[activeTarget.id.toUpperCase()];
                setPopupMessage(info || { name: 'THE MOON', type: 'TARGET', desc: 'Target acquired.' });
            } else {
                const info = PLANET_INFO[activeTarget.id.toUpperCase()];
                setPopupMessage(info || { name: activeTarget.name, type: 'PLANET', desc: 'Data acquired.' });
            }
        }, 500);
    };

    const triggerEmergencySequence = () => {
        if (emergencyTriggeredRef.current) return;
        emergencyTriggeredRef.current = true;

        setIsEmergency(true);
        audioManager.play(ASSETS.SE_ALERT);

        // Loop SE_ALERT
        if (emergencyAudioRef.current) clearInterval(emergencyAudioRef.current);
        emergencyAudioRef.current = setInterval(() => {
            audioManager.play(ASSETS.SE_ALERT);
        }, 1500);

        // Vibration
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200, 100, 200, 500]);

        // After 4 seconds, clear emergency visual but Keep Sound
        setTimeout(() => {
            setIsEmergency(false);

            // Spawn Astronaut Target
            const alpha = orientation.alpha;
            // Should be behind or offset? Lets put it 180 deg away
            const targetAlpha = (alpha + 180) % 360;

            const astronaut = {
                id: 'astronaut',
                type: 'TARGET',
                name: 'UNKNOWN SIGNAL',
                asset: ASSETS.IMG_ASTRONAUT,
                lockText: 'SIGNAL MATCHING...',
                alpha: targetAlpha,
                beta: 90, // Horizon
                visited: false
            };

            setPlanets(prev => {
                if (prev.some(p => p.id === 'astronaut')) return prev;
                // REMOVE ALL OTHER PLANETS (Hide them by filtering or just replacing the array)
                // User wants others to disappear. Let's just keep the astronaut.
                return [astronaut];
            });

        }, 4000);
    };

    const handleDismiss = () => {
        if (!popupMessage) return;

        // Stop Emergency Sound if we found Astronaut
        if (activeTarget?.id === 'astronaut') {
            if (emergencyAudioRef.current) {
                clearInterval(emergencyAudioRef.current);
                emergencyAudioRef.current = null;
            }
            // SUCCESS -> GO TO CLIMAX
            if (onFound) onFound();
            return;
        }

        // Logic for others
        if (activeTarget?.id === 'moon') {
            // Moon Found -> Emergency Sequence
            setPopupMessage(null);
            setLandingTarget(null);

            // Hide Moon Immediately (Like other planets)
            setPlanets(prev => prev.map(p => p.id === 'moon' ? { ...p, visited: true } : p));

            triggerEmergencySequence();
        } else {
            // Decoy Found -> Just Reset
            setPopupMessage(null);
            setLandingTarget(null);
            setPlanets(prev => prev.map(p =>
                p.id === activeTarget.id ? { ...p, visited: true } : p
            ));
        }
    };

    // --- RENDER ---

    if (!calibrated) return <div className="w-full h-full bg-black text-terminal-green flex items-center justify-center font-mono animate-pulse">INITIALIZING SENSORS...</div>;

    // Background Parallax
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
                        transition: 'none',
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
                                {activeTarget?.id === 'astronaut' ? '緊急事態：信号の発信源を特定せよ' :
                                    activeTarget?.type === 'TARGET' ? '月を捕捉してください' : '未確認信号を調査中...'}
                            </p>
                        </motion.div>
                    </div>
                )}

                {/* Arrow Guide */}
                {!landingTarget && distance > 15 && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60] transition-opacity duration-500"
                        style={{ opacity: Math.min(1, Math.max(0, (distance - 15) / 20)) }}
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
                    if (planet.visited) return null;

                    const SCALE = 15;
                    const dAlpha = getAngleDistance(planet.alpha, orientation.alpha);
                    const dBeta = getAngleDistance(planet.beta, orientation.beta);
                    const pX = -dAlpha * SCALE;
                    const pY = -dBeta * SCALE;

                    const isVisible = Math.abs(pX) <= window.innerWidth && Math.abs(pY) <= window.innerHeight;
                    const isLanding = landingTarget?.id === planet.id;

                    if (isLanding) {
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

                    const isSaturn = planet.id === 'saturn';

                    return (
                        <div
                            key={planet.id}
                            className={`absolute top-1/2 left-1/2 w-64 h-64 -ml-32 -mt-32 cursor-none will-change-transform ${isSaturn ? '' : 'rounded-full'}`}
                            style={{
                                transform: `translate3d(${pX}px, ${pY}px, 0)`,
                                visibility: isVisible ? 'visible' : 'hidden',
                                zIndex: 10
                            }}
                        >
                            <div
                                className={`relative w-full h-full transition-all duration-300
                                    ${isSaturn ? '' : 'rounded-full overflow-hidden'}
                                    ${targetVisible && activeTarget?.id === planet.id && !landingTarget ? 'drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] opacity-100' : 'opacity-90'}
                                `}
                            >
                                <img
                                    src={planet.asset}
                                    alt={planet.name}
                                    className={`w-full h-full mix-blend-screen ${isSaturn ? 'object-contain' : 'object-cover'}`}
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
                                                transition={{ duration: 2.0, ease: "linear" }}
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

            {/* POPUP OVERLAY */}
            <AnimatePresence>
                {popupMessage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 cursor-pointer"
                        onClick={handleDismiss}
                    >
                        {typeof popupMessage === 'object' ? (
                            <div className="border border-terminal-green bg-black/90 p-6 max-w-md w-full shadow-[0_0_30px_rgba(51,255,0,0.2)] relative overflow-hidden pointer-events-none">
                                {/* Scanline */}
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
                            // Fallback
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
                {/* EMERGENCY ALERT OVERLAY */}
                {isEmergency && (
                    <div className="absolute inset-0 z-[300] flex flex-col items-center justify-center bg-red-950/90 text-red-500 font-mono border-[20px] border-red-600 animate-pulse pointer-events-none">
                        <h1 className="text-5xl md:text-7xl font-black mb-4 text-center tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,0,0,1)]">
                            WARNING
                        </h1>
                        <div className="text-xl md:text-3xl font-bold bg-black px-6 py-4 border border-red-500 text-center">
                            救難信号を検知<br />
                            <span className="text-sm md:text-base font-normal opacity-70">DISTRESS SIGNAL DETECTED</span>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
