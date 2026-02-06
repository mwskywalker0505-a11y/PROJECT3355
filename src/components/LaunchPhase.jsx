import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Radio, Settings, ChevronRight, Rocket, Zap, Gauge, Wind } from 'lucide-react';

import { PHASES, ASSETS } from '../constants';
import { audioManager } from '../utils/AudioManager';

export default function LaunchPhase({ onLaunch }) {
    const [isLaunching, setIsLaunching] = useState(false);
    const [showButton, setShowButton] = useState(false);
    const videoRef = useRef(null);

    // Speed up the warp video when it mounts
    useEffect(() => {
        if (isLaunching && videoRef.current) {
            videoRef.current.playbackRate = 1.0;
        }
    }, [isLaunching]);

    // Initial sequence to show immersive text before button
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowButton(true);
        }, 2000); // Wait for text to read
        return () => clearTimeout(timer);
    }, []);

    const requestPermission = async () => {
        // iOS 13+ requires permission for DeviceOrientation
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    handleLaunch();
                } else {
                    alert('Device Orientation permission is required for the experience. / ジャイロセンサーの許可が必要です。');
                }
            } catch (error) {
                console.error(error);
                alert('Error requesting orientation permission.');
            }
        } else {
            // Non-iOS or older devices usually handle this automatically
            handleLaunch();
        }
    };

    const handleLaunch = () => {
        setIsLaunching(true);
        audioManager.play(ASSETS.SE_TOUCH);

        // IMMEDIATE LAUNCH (Reduced delay from 2000ms to 200ms)
        // This ensures the Launch SE plays almost immediately after the Touch SE
        setTimeout(() => {
            onLaunch();
        }, 200);
    };

    return (
        <div className="flex flex-col items-center justify-between h-full w-full py-12 px-4 z-10 relative overflow-hidden">
            {/* Ambient Background Effects - Cockpit Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-terminal-amber/10 via-black to-black opacity-60" />

            {/* Cockpit Frame Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
                <svg className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,0 L100,0 L100,100 L0,100 Z M50,50" fill="none" stroke="rgba(255, 176, 0, 0.1)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    <path d="M0,0 L20,20 M100,0 L80,20 M0,100 L20,80 M100,100 L80,80" stroke="rgba(255, 176, 0, 0.2)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
            </div>


            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a00_1px,transparent_1px),linear-gradient(to_bottom,#1a1a00_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            {/* HUD Top - Brighter */}
            <div className="w-full flex justify-between text-terminal-amber opacity-90 border-b border-terminal-amber/40 pb-4 z-20">
                <div className="flex items-center gap-2">
                    <Settings size={16} className="animate-spin-slow text-terminal-amber" />
                    <span className="text-xs tracking-widest font-mono font-bold text-shadow-amber">SYSTEM ONLINE</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs tracking-widest font-mono font-bold">v2.0.4</span>
                    <Radio size={16} className="animate-pulse text-red-500" />
                </div>
            </div>

            {/* Center Content */}
            <div className="relative flex flex-col items-center justify-center z-20 h-full">

                {/* Engine Prompt */}
                <div className="mb-12 text-center h-24 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="text-terminal-amber/80 text-sm font-mono tracking-widest mb-2 font-bold"
                    >
                        ENGINE STANDBY
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1.2 }}
                        className="text-white font-sans text-2xl tracking-wider drop-shadow-md font-bold"
                    >
                        起動ボタンを押してください
                    </motion.div>
                </div>

                {/* Main Action Area */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                    {/* Rotating Rings - Multi-colored for richness */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute w-full h-full border-2 border-terminal-amber/20 rounded-full border-dashed animate-pulse"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute w-72 h-72 border border-orange-500/10 rounded-full"
                    />

                    {/* Rich Ignition Button - Orange/Amber Theme */}
                    <AnimatePresence>
                        {showButton && (
                            <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={requestPermission}
                                disabled={isLaunching}
                                className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center group transition-all duration-300 ${isLaunching ? 'cursor-wait' : 'cursor-pointer'} [backface-visibility:hidden] [transform:translateZ(0)] will-change-transform shadow-[0_0_40px_rgba(255,176,0,0.3)] hover:shadow-[0_0_60px_rgba(255,176,0,0.6)]`}
                            >
                                {/* Button Background & Glow */}
                                <div className="absolute inset-0 bg-terminal-amber/10 rounded-full border-4 border-terminal-amber/60 group-hover:bg-terminal-amber/20 transition-all backdrop-blur-sm" />

                                {/* Inner Warning Ring */}
                                <div className="absolute inset-3 border-2 border-orange-500/50 rounded-full border-dashed animate-spin-slow [animation-duration:30s]" />

                                {/* Core Pulsing */}
                                <div className="absolute inset-0 rounded-full bg-orange-500/5 animate-pulse-fast" />

                                {/* Icon - Flame/Rocket - Crisp */}
                                <div className="relative z-10 p-5 rounded-full bg-black/40 border-2 border-terminal-amber/30 mb-2 group-hover:bg-terminal-amber/20 transition-colors">
                                    <Rocket
                                        className="w-12 h-12 text-terminal-amber group-hover:text-white transition-colors duration-300 [backface-visibility:hidden] drop-shadow-[0_0_8px_rgba(255,176,0,0.8)] animate-pulse"
                                        strokeWidth={2}
                                    />
                                </div>

                                {/* Text - Crisp */}
                                <span className="text-terminal-amber font-black tracking-widest text-3xl group-hover:text-white transition-colors antialiased [backface-visibility:hidden] drop-shadow-md">起動</span>
                                <span className="text-orange-400 text-xs mt-1 group-hover:text-orange-200 font-mono tracking-tighter antialiased [backface-visibility:hidden] font-bold">READY TO LAUNCH</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* HUD Bottom - Brighter & More detailed */}
            <div className="w-full text-center space-y-4 z-20">
                {!isLaunching ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5, duration: 1 }}
                        className="text-white text-lg tracking-[0.2em] animate-pulse font-bold bg-terminal-amber/10 py-2 px-6 inline-block rounded border border-terminal-amber/30 shadow-[0_0_15px_rgba(255,176,0,0.3)]"
                    >
                        TAP TO ENGAGE THRUSTERS
                    </motion.div>
                ) : (
                    <div className="text-white text-lg tracking-[0.2em] animate-pulse bg-red-500/20 py-2 px-6 inline-block rounded border border-red-500/50">
                        IGNITION SEQUENCE STARTED...
                    </div>
                )}

                {/* Meters - Distinct Colors and Brighter - Synced Pulse */}
                <div className="flex justify-center gap-6 text-sm font-mono border-t border-white/10 pt-6">
                    <div className="flex flex-col items-center gap-1 min-w-[70px] animate-pulse">
                        <Wind className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-400 font-bold">O2</span>
                        <span className="text-white">100%</span>
                    </div>
                    <div className="w-[1px] h-10 bg-white/20" />
                    <div className="flex flex-col items-center gap-1 min-w-[70px] animate-pulse [animation-delay:0.5s]">
                        <Gauge className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-400 font-bold">GRAVITY</span>
                        <span className="text-white">1.0G</span>
                    </div>
                    <div className="w-[1px] h-10 bg-white/20" />
                    <div className="flex flex-col items-center gap-1 min-w-[70px] animate-pulse [animation-delay:1s]">
                        <span className="w-3 h-3 rounded-full bg-terminal-green shadow-[0_0_5px_#33ff00]" />
                        <span className="text-terminal-green font-bold">STATUS</span>
                        <span className="text-white">READY</span>
                    </div>
                </div>
            </div>

            {/* Warp overlay on launch */}
            {isLaunching && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-black"
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0 mix-blend-screen opacity-90"
                    >
                        <source src="/warp.mp4" type="video/mp4" />
                    </video>

                    <div className="relative z-10 text-white font-bold tracking-[0.5em] text-3xl font-mono animate-pulse text-shadow-glow">
                        WARP DRIVE ENGAGED
                    </div>
                </motion.div>
            )}
        </div>
    );
}
