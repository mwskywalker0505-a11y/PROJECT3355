import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TEXT_SEQUENCE = [
    { text: "SYSTEM BOOT SEQUENCE...", sub: "システム初期化中..." },
    { text: "ESTABLISHING NEURAL LINK...", sub: "神経接続を確立中..." },
    { text: "CAUTION: HEADPHONES REQUIRED", sub: "没入感を高めるため、ヘッドフォンを着用してください" },
    { text: "TARGET ACQUIRED: [ THE MOON ]", sub: "ターゲット確認：月" },
    { text: "ALL SYSTEMS GREEN.", sub: "搭乗準備完了" },
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
            }, 3000); // 3 seconds per line
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                onComplete();
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [started, currentIndex, onComplete]);

    return (
        <div className="flex flex-col items-start justify-center h-full p-8 text-terminal-green font-mono z-10 relative">
            {!started ? (
                <button
                    onClick={handleStart}
                    className="mx-auto border-2 border-terminal-green px-8 py-4 text-xl animate-pulse cursor-pointer hover:bg-terminal-green hover:text-black transition-colors duration-300"
                >
                    START SYSTEM
                </button>
            ) : (
                <div className="w-full space-y-4">
                    <AnimatePresence>
                        {TEXT_SEQUENCE.slice(0, currentIndex + 1).map((line, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="border-l-2 border-terminal-green pl-4"
                            >
                                <div className="text-lg md:text-xl font-bold tracking-wider">
                                    {line.text}
                                </div>
                                <div className="text-sm opacity-70 mt-1">
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
