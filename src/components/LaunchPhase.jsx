import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Radio, Settings, ChevronRight, Rocket } from 'lucide-react';

import { PHASES, ASSETS } from '../constants';
import { audioManager } from '../utils/AudioManager';

export default function LaunchPhase({ onLaunch }) {
    const [isLaunching, setIsLaunching] = useState(false);
    const [showButton, setShowButton] = useState(false);

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

        // Add a small delay for the animation/sound before switching phase
        setTimeout(() => {
            onLaunch();
        }, 2000); // 2 seconds warp effect
    };

    return (
        <div className="flex flex-col items-center justify-between h-full w-full py-12 px-4 z-10 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-terminal-green/5 via-black to-black opacity-50" />

            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f2416_1px,transparent_1px),linear-gradient(to_bottom,#0f2416_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

            {/* HUD Top */}
            <div className="w-full flex justify-between text-terminal-green opacity-80 border-b border-terminal-green/30 pb-4 z-20">
                <div className="flex items-center gap-2">
                    <Settings size={16} className="animate-spin-slow" />
                    <span className="text-xs tracking-widest font-mono">SYSTEM ONLINE</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs tracking-widest font-mono">v2.0.4</span>
                    <Radio size={16} className="animate-pulse" />
                </div>
            </div>

            {/* Center Content */}
            <div className="relative flex flex-col items-center justify-center z-20 h-full">

                {/* Immersive Text Sequence */}
                <div className="mb-12 text-center h-24 flex flex-col items-center justify-center">
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

                {/* Main Action Area */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Rotating Rings */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute w-full h-full border border-terminal-green/20 rounded-full border-dashed"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute w-56 h-56 border border-terminal-green/10 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: 180 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute w-60 h-60 border-t-2 border-b-2 border-transparent border-t-terminal-green/30 border-b-terminal-green/30 rounded-full"
                    />

                    {/* Rich Button */}
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
                                className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center group transition-all duration-300 ${isLaunching ? 'cursor-wait' : 'cursor-pointer'}`}
                            >
                                {/* Button Background & Glow */}
                                <div className="absolute inset-0 bg-terminal-green/5 backdrop-blur-md rounded-full border border-terminal-green/50 shadow-[0_0_15px_rgba(51,255,0,0.3)] group-hover:shadow-[0_0_30px_rgba(51,255,0,0.6)] group-hover:bg-terminal-green/10 transition-all" />

                                {/* Inner Ring */}
                                <div className="absolute inset-3 border border-terminal-green/30 rounded-full" />

                                {/* Icon - Increased size and stroke width for crispness */}
                                <Rocket
                                    className="w-12 h-12 text-terminal-green mb-2 group-hover:translate-y-[-2px] transition-transform duration-300"
                                    strokeWidth={1.5}
                                />

                                {/* Text */}
                                <span className="text-terminal-green font-bold tracking-widest text-sm group-hover:text-white transition-colors">START SYSTEM</span>
                                <span className="text-terminal-green/50 text-[10px] mt-1 group-hover:text-terminal-green/80 font-mono tracking-tighter">INITIATE LAUNCH</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* HUD Bottom */}
            <div className="w-full text-center space-y-2 z-20">
                {!isLaunching ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5, duration: 1 }}
                        className="text-terminal-green/60 text-xs tracking-[0.2em] animate-pulse"
                    >
                        TAP TO ENGAGE THRUSTERS
                    </motion.div>
                ) : (
                    <div className="text-terminal-amber text-xs tracking-[0.2em] animate-pulse">
                        IGNITION SEQUENCE STARTED...
                    </div>
                )}

                <div className="flex justify-center gap-8 text-terminal-green/30 text-[10px] font-mono border-t border-terminal-green/10 pt-4">
                    <span>O2: 100%</span>
                    <span>GRAVITY: 1.0G</span>
                    <span>STATUS: READY</span>
                </div>
            </div>

            {/* Warp overlay on launch */}
            {isLaunching && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-white"
                >
                    <div className="text-black font-bold tracking-widest text-xl animate-pulse">
                        WARP DRIVE ENGAGED
                    </div>
                </motion.div>
            )}
        </div>
    );
}
