import React, { useState, useEffect, useRef } from 'react';
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

            {/* STAGE 1: FIND THE ASTRONAUT */}
            {stage === 'SEARCH' && (
                <div
                    className="cursor-pointer animate-float flex flex-col items-center justify-center z-10"
                    onClick={handleAstronautClick}
                >
                    <img
                        src={ASSETS.IMG_ASTRONAUT}
                        alt="Astronaut"
                        className="w-64 h-64 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                    />
                    <p className="mt-8 text-center text-cyan-400 animate-pulse text-sm tracking-widest bg-black/50 backdrop-blur-sm px-4 py-2 rounded">
                        UNKNOWN SIGNAL DETECTED...<br />
                        TAP TO CONNECT
                    </p>
                </div>
            )}

            {/* STAGE 2: EMOTIONAL MESSAGE */}
            {stage === 'MESSAGE' && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/80 transition-opacity duration-1000 p-8 text-center z-20"
                    style={{ opacity: textOpacity }}
                >
                    <div>
                        <p className="text-xl md:text-2xl font-serif italic mb-6 leading-relaxed text-yellow-100">
                            "Look at the stars.<br />
                            君のために、すべて輝いている..."
                        </p>
                        <p className="text-md text-gray-400">
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
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 animate-fade-in pointer-events-none">
                    <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 mb-8 drop-shadow-lg">
                        大好きだよ
                    </h1>
                    <p className="text-xl tracking-[0.3em] font-serif text-gray-400 border-t border-gray-800 pt-8 mt-4">
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
