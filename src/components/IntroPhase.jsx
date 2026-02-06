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

    const handleStart = async () => {
        // 1. Trigger Audio Unlock (App.jsx)
        onStart();

        // 2. Request Gyro Permission (iOS 13+)
        // Must be triggered by user interaction (click/tap)
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState !== 'granted') {
                    alert("ジャイロセンサーの許可が必要です。");
                }
            } catch (error) {
                console.error("Gyro permission error:", error);
            }
        }

        setStarted(true);
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
        <div className="flex flex-col items-center justify-center h-full p-8 text-terminal-green font-mono z-10 relative overflow-hidden bg-black">
            {/* Grid Lines (Consistent with LaunchPhase) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f2416_1px,transparent_1px),linear-gradient(to_bottom,#0f2416_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

            {!started ? (
                <div className="flex flex-col items-center justify-evenly h-full w-full z-20 py-10">
                    {/* TITLE SECTION - Massive & Neon */}
                    <div className="text-center flex flex-col items-center justify-center space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="text-terminal-green/80 text-lg md:text-xl font-mono tracking-[0.5em] mb-2 font-bold drop-shadow-[0_0_10px_rgba(51,255,0,0.5)]"
                        >
                            HYPER-SPATIAL NAVIGATOR
                        </motion.div>

                        <div className="relative group cursor-default mb-8">
                            {/* Main Glowing Title - Green Theme */}
                            <h1 className="text-5xl md:text-7xl font-bold tracking-[0.2em] font-mono
                                           bg-gradient-to-r from-emerald-600 via-green-400 to-emerald-600
                                           bg-clip-text text-transparent
                                           drop-shadow-[0_0_20px_rgba(51,255,0,0.6)]
                                           animate-pulse-slow select-none">
                                PROJECT 3355
                            </h1>

                            {/* Subtle glitch/scanline overlay effect underneath - Green Tint */}
                            <div className="absolute inset-0 w-full h-full pointer-events-none opacity-30 mix-blend-overlay bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(51,255,0,0.3)_3px)]" />
                        </div>

                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "200px" }}
                            transition={{ duration: 1, delay: 1.2 }}
                            className="h-1 bg-gradient-to-r from-cyan-500 to-terminal-green rounded-full shadow-[0_0_20px_#00ff88]"
                        />
                    </div>

                    {/* Rich Start Button - Enlarged & Neon */}
                    <div className="relative w-80 h-80 flex items-center justify-center mt-8">
                        {/* Rotating Rings */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            className="absolute w-full h-full border-2 border-terminal-green/30 rounded-full border-dashed shadow-[0_0_30px_rgba(51,255,0,0.2)]"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[280px] h-[280px] border border-terminal-green/20 rounded-full"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-[350px] h-[350px] bg-terminal-green/5 rounded-full blur-2xl"
                        />

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStart}
                            className="relative w-60 h-60 rounded-full flex flex-col items-center justify-center group cursor-pointer [backface-visibility:hidden] [transform:translateZ(0)] will-change-transform z-30"
                        >
                            {/* Button Background & Strong Glow */}
                            <div className="absolute inset-0 bg-black/80 rounded-full border-2 border-terminal-green shadow-[0_0_30px_rgba(51,255,0,0.5),inset_0_0_20px_rgba(51,255,0,0.2)] group-hover:shadow-[0_0_60px_rgba(51,255,0,0.8),inset_0_0_40px_rgba(51,255,0,0.4)] group-hover:bg-terminal-green/10 transition-all duration-300" />

                            {/* Inner Ring */}
                            <div className="absolute inset-4 border border-terminal-green/50 rounded-full group-hover:scale-95 transition-transform duration-500" />

                            {/* Text Content */}
                            <div className="relative flex flex-col items-center overflow-hidden">
                                <span className="text-terminal-green text-3xl font-black tracking-widest group-hover:text-white transition-colors antialiased drop-shadow-[0_0_10px_rgba(51,255,0,1)]">
                                    搭乗する
                                </span>
                                <span className="text-terminal-green/70 text-sm mt-2 font-mono tracking-[0.3em] group-hover:text-terminal-green transition-colors font-bold">
                                    BOARD SHIP
                                </span>
                                <motion.div
                                    className="w-full h-[1px] bg-terminal-green/50 mt-2"
                                    animate={{ width: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>
                        </motion.button>
                    </div>

                    {/* Footer / Status */}
                    <div className="text-terminal-green/40 font-mono text-xs tracking-widest mt-8">
                        SYSTEM STATUS: WAITING FOR PILOT
                    </div>
                </div>
            ) : (
                <div className="w-full space-y-6 max-w-3xl mx-auto z-20 mt-10">
                    <AnimatePresence>
                        {TEXT_SEQUENCE.slice(0, currentIndex + 1).map((line, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-l-4 border-terminal-green pl-6 py-2 bg-terminal-green/5 rounded-r"
                            >
                                <div className="text-2xl md:text-3xl font-bold tracking-wider text-terminal-green font-mono drop-shadow-[0_0_10px_rgba(51,255,0,0.5)]">
                                    {line.text}
                                </div>
                                <div className="text-base md:text-lg opacity-80 mt-1 text-white/90 font-sans tracking-wide">
                                    {line.sub}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {currentIndex < TEXT_SEQUENCE.length && (
                        <motion.div
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="w-4 h-8 bg-terminal-green inline-block ml-4 shadow-[0_0_10px_#33ff00]"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
