import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TEXT_SEQUENCE = [
    { text: "SYSTEM BOOT SEQUENCE...", sub: "システム初期化中..." },
    { text: "ESTABLISHING NEURAL LINK...", sub: "神経接続を確立中..." },
    { text: "BIOS CHECK: OK", sub: "BIOSチェック：正常" },
    { text: "LOADING PERIPHERAL DRIVERS...", sub: "周辺機器ドライバ読み込み中..." },
    { text: "CALIBRATING SENSORS...", sub: "センサーキャリブレーション実行中..." },
    { text: "OPTIMIZING POWER OUTPUT...", sub: "出力最適化中..." },
    { text: "SYNCHRONIZING AUDIO WAVES...", sub: "音響波形同期中..." },
    { text: "TARGET ACQUIRED: [ THE MOON ]", sub: "ターゲット確認：月" },
    { text: "CALCULATING TRAJECTORY...", sub: "軌道計算中..." },
    { text: "ESTIMATED TRAVEL TIME: UNKNOWN", sub: "推定移動時間：不明" },
    { text: "LIFE SUPPORT SYSTEMS: ACTIVE", sub: "生命維持装置：アクティブ" },
    { text: "ALL SYSTEMS GREEN.", sub: "全システム正常" },
    { text: "INITIALIZING LAUNCH PROTOCOLS...", sub: "発射プロトコル初期化中..." },
    { text: "ARE YOU READY?", sub: "準備はいいかい？" },
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
            }, 2000); // 2 seconds per line
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
