import React, { useState, useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { ASSETS } from '../constants';
import { audioManager } from '../utils/AudioManager';

const ClimaxPhase = () => {
    const [stage, setStage] = useState('SEARCH'); // SEARCH, MESSAGE, CREDITS, FINAL
    const [textOpacity, setTextOpacity] = useState(0);

    // Play BGM and Transition logic
    const handleAstronautClick = () => {
        if (stage !== 'SEARCH') return;

        // 1. Play Touch Sound
        audioManager.play(ASSETS.SE_TOUCH, false, 3.0);

        // 2. Show First Message
        setStage('MESSAGE');
        setTimeout(() => setTextOpacity(1), 500);

        // 3. Start Music & Transition to Credits after delay
        setTimeout(() => {
            setTextOpacity(0); // Fade out text

            setTimeout(() => {
                // START MUSIC (YELLOW)
                audioManager.play(ASSETS.BGM_ENDING, false, 1.0);

                // Start Credits
                setStage('CREDITS');
            }, 2000);
        }, 6000); // Read time for the first message
    };

    // End of Credits -> Final Message
    useEffect(() => {
        if (stage === 'CREDITS') {
            // Assume 30s for credits (adjust animation duration in CSS)
            const timer = setTimeout(() => {
                setStage('FINAL');
            }, 35000);
            return () => clearTimeout(timer);
        }
    }, [stage]);

    // Heartbeat Effect for Stage 1 (SEARCH/RESCUE)
    const heartbeatRef = useRef(null);
    useEffect(() => {
        if (stage === 'SEARCH') {
            // Start Heartbeat
            audioManager.play(ASSETS.SE_HEARTBEAT, false, 2.5);
            heartbeatRef.current = setInterval(() => {
                audioManager.play(ASSETS.SE_HEARTBEAT, false, 2.5);
            }, 1200);
        } else {
            // Stop Heartbeat
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            audioManager.stop(ASSETS.SE_HEARTBEAT); // Optional if supported
        }
        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, [stage]);

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center text-white font-mono z-[100]">

            {/* BACKGROUND IMAGE LAYER (Visible during CREDITS & FINAL) */}
            {(stage === 'CREDITS' || stage === 'FINAL') && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={ASSETS.IMG_ENDING_BG}
                        alt="Background"
                        className="w-full h-full object-cover animate-zoom-out-reveal opacity-60"
                    />
                    {/* Dark Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-black/40" />
                </div>
            )}

            {/* STAGE 1: FIND THE ASTRONAUT -> REPLACED WITH VITAL SIGN UI */}
            {stage === 'SEARCH' && (
                <div
                    className="cursor-pointer animate-float flex flex-col items-center justify-center z-10 w-full px-4"
                    onClick={handleAstronautClick}
                >
                    {/* Floating Astronaut Image (Slightly larger or more visible?) */}
                    <img
                        src={ASSETS.IMG_ASTRONAUT}
                        alt="Astronaut"
                        className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_30px_rgba(0,255,255,0.3)] mb-4"
                    />

                    {/* VITAL SIGN UI */}
                    <div className="relative w-full max-w-lg p-6 border-y-4 border-blue-500 bg-blue-950/40 backdrop-blur-md rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,100,255,0.3)]">
                        {/* Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,50,100,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,50,100,0.2)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center text-blue-100 font-mono">
                            <div className="flex items-center space-x-3 mb-4 animate-pulse">
                                <Activity className="w-8 h-8 text-blue-400" />
                                <h2 className="text-xl md:text-2xl font-bold tracking-widest text-blue-400">VITAL SIGNS DETECTED</h2>
                            </div>

                            {/* ECG Animation */}
                            <div className="w-full h-24 bg-black/60 border border-blue-800 relative overflow-hidden mb-6 rounded-lg">
                                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                    <path d="M0,50 L20,50 L30,20 L40,80 L50,50 L100,50 L110,20 L120,80 L130,50 L200,50"
                                        fill="none" stroke="#60a5fa" strokeWidth="2" vectorEffect="non-scaling-stroke"
                                        className="animate-ecg-scan" />
                                </svg>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full text-center mb-4">
                                <div>
                                    <p className="text-[10px] text-blue-400 mb-1 tracking-wider">HEART RATE</p>
                                    <p className="text-3xl font-bold animate-heartbeat text-white">72 <span className="text-sm font-normal text-blue-300">BPM</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-400 mb-1 tracking-wider">DNA MATCH</p>
                                    <p className="text-3xl font-bold text-green-400">99.9%</p>
                                </div>
                            </div>

                            <div className="w-full bg-blue-900/40 p-3 border border-blue-700/50 text-center animate-pulse rounded mb-4">
                                <p className="text-sm md:text-base tracking-widest text-blue-200">
                                    IDENTITY CONFIRMED:<br />
                                    <span className="font-bold text-white">MICHIHO WAKAIZUMI</span>
                                </p>
                            </div>

                            <p className="text-sm text-blue-400 animate-bounce tracking-widest border border-blue-500/50 px-6 py-2 rounded-full hover:bg-blue-500/20 transition-colors">
                                TAP TO CONNECT<br />
                                <span className="text-xs opacity-70">接続する</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* STAGE 2: EMOTIONAL MESSAGE */}
            {stage === 'MESSAGE' && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/80 transition-opacity duration-1000 p-8 text-center z-20"
                    style={{ opacity: textOpacity }}
                >
                    <div className="relative">
                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-900/20 blur-3xl rounded-full pointer-events-none"></div>

                        <p className="relative text-3xl md:text-5xl font-serif italic mb-12 leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-100 drop-shadow-[0_0_15px_rgba(255,200,0,0.3)]">
                            "Look at the stars."<br />
                            <span className="text-2xl md:text-4xl mt-4 block text-white/90 not-italic tracking-wider">
                                君のために、すべて輝いている...
                            </span>
                        </p>
                        <p className="text-xl md:text-2xl text-blue-200/80 tracking-[0.2em] font-sans border-t border-blue-500/30 pt-8 inline-block px-12">
                            見つけてくれて、ありがとう。
                        </p>
                    </div>
                </div>
            )}

            {/* STAGE 3: END CREDITS (Movie Style) */}
            {stage === 'CREDITS' && (
                <div className="absolute inset-0 w-full h-full z-20 flex justify-center overflow-hidden pointer-events-none">
                    <div className="animate-credits-scroll text-center space-y-24 pt-[100vh]">

                        <div>
                            <h2 className="text-sm text-gray-500 tracking-[0.5em] mb-4">MISSION COMPLETE</h2>
                            <h1 className="text-4xl font-bold tracking-widest text-white">PROJECT 3355</h1>
                        </div>

                        <div>
                            <h3 className="text-xs text-gray-500 mb-2">CAST</h3>
                            <p className="text-xl">ME & YOU</p>
                        </div>

                        <div>
                            <h3 className="text-xs text-gray-500 mb-2">MUSIC</h3>
                            <p className="text-xl text-yellow-300">Coldplay - YELLOW</p>
                        </div>

                        <div>
                            <h3 className="text-xs text-gray-500 mb-2">SPECIAL THANKS</h3>
                            <p className="text-lg">The Universe</p>
                            <p className="text-lg">All the Stars</p>
                            <p className="text-lg mt-4">AND YOU</p>
                        </div>
                    </div>
                </div>
            )}

            {/* STAGE 4: FINAL MESSAGE */}
            {stage === 'FINAL' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black animate-fade-in text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 mb-8 drop-shadow-lg leading-tight">
                        やっと、逢えたね
                    </h1>
                    <p className="text-lg md:text-2xl text-blue-200 font-serif mb-12 opacity-90 tracking-widest">
                        これからも、<br className="md:hidden" />同じ星を見上げよう
                    </p>
                    <p className="text-xs md:text-sm tracking-[0.5em] font-serif text-gray-500 border-t border-gray-800 pt-8 mt-8">
                        To Be Continued
                    </p>
                </div>
            )}

            {/* CSS Animation Styles (Inline for simplicity) */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(2deg); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                
                @keyframes credits-scroll {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-150%); }
                }
                .animate-credits-scroll {
                    animation: credits-scroll 45s linear forwards; /* Extended to match BG */
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 3s ease-out forwards; }

                @keyframes zoom-out-reveal {
                    0% { transform: scale(1.6); }
                    100% { transform: scale(1.0); }
                }
                .animate-zoom-out-reveal {
                    animation: zoom-out-reveal 40s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ClimaxPhase;
