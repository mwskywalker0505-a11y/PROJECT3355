import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TEXT_SEQUENCE = [
    { text: "SYSTEM BOOT SEQUENCE...", sub: "システム初期化中..." },
    { text: "ESTABLISHING NEURAL LINK...", sub: "神経接続を確立中..." },
    { text: "SENSORS: CALIBRATED.", sub: "センサー調整完了" },
    { text: "AUDIO SYNC: OK.", sub: "音響同期完了" },
    { text: "TARGET DETECTED: [ THE MOON ]", sub: "ターゲット捕捉：月" },
    { text: "LIFE SUPPORT: ACTIVE", sub: "生命維持装置：正常" },
    { text: "ALL SYSTEMS GREEN.", sub: "オールグリーン" },
    { text: "STANDBY FOR PILOT INPUT.", sub: "パイロット入力待機中" },
];

export default function IntroPhase({ onStart, onComplete }) {
    const [started, setStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleStart = () => {
        setStarted(true);
        onStart(); // Trigger audio unlock
    };

    useEffect(() => {
        if (!started) return;

        if (currentIndex < TEXT_SEQUENCE.length) {
            const timeout = setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 1500); // 1.5 seconds per line -> ~12-13s total
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                onComplete();
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [started, currentIndex, onComplete]);

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-terminal-green font-mono z-10 relative overflow-hidden">
            {/* Grid Lines (Consistent with LaunchPhase) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f2416_1px,transparent_1px),linear-gradient(to_bottom,#0f2416_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            {!started ? (
                <div className="flex flex-col items-center justify-center space-y-12 z-20">
                    {/* Immersive Text Sequence */}
                    <div className="text-center flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="text-terminal-green/80 text-sm font-mono tracking-widest mb-2"
                        >
                            MISSION: MOON SEARCH
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 1.2 }}
                            className="text-white font-sans text-lg tracking-wider"
                        >
                            宇宙船に乗り込み、月へ向かおう
                        </motion.div>
                    </div>

                    {/* Rich Start Button */}
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        {/* Rotating Rings */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute w-full h-full border border-terminal-green/20 rounded-full border-dashed"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute w-40 h-40 border border-terminal-green/10 rounded-full"
                        />

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStart}
                            className="relative w-32 h-32 rounded-full flex flex-col items-center justify-center group cursor-pointer [backface-visibility:hidden] [transform:translateZ(0)] will-change-transform"
                        >
                            {/* Button Background & Glow */}
                            <div className="absolute inset-0 bg-terminal-green/5 rounded-full border border-terminal-green/50 shadow-[0_0_15px_rgba(51,255,0,0.3)] group-hover:shadow-[0_0_30px_rgba(51,255,0,0.6)] group-hover:bg-terminal-green/10 transition-all" />

                            {/* Inner Ring */}
                            <div className="absolute inset-3 border border-terminal-green/30 rounded-full" />

                            {/* Text */}
                            <span className="text-terminal-green font-bold tracking-widest text-sm group-hover:text-white transition-colors antialiased [backface-visibility:hidden]">START SYSTEM</span>
                            <span className="text-terminal-green/50 text-[10px] mt-1 group-hover:text-terminal-green/80 font-mono tracking-tighter antialiased [backface-visibility:hidden]">INITIALIZE</span>
                        </motion.button>
                    </div>
                </div>
            ) : (
                <div className="w-full space-y-4 max-w-2xl mx-auto z-20">
                    <AnimatePresence>
                        {TEXT_SEQUENCE.slice(0, currentIndex + 1).map((line, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="border-l-2 border-terminal-green pl-4"
                            >
                                <div className="text-lg md:text-xl font-bold tracking-wider text-terminal-green">
                                    {line.text}
                                </div>
                                <div className="text-sm opacity-70 mt-1 text-terminal-green/80">
                                    {line.sub}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {currentIndex < TEXT_SEQUENCE.length && (
                        <motion.div
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="w-3 h-6 bg-terminal-green inline-block ml-2"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
