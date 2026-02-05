import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, Radio, Settings, AlertCircle } from 'lucide-react';

export default function LaunchPhase({ onLaunch }) {
    const [isLaunching, setIsLaunching] = useState(false);

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
        // Add a small delay for the animation/sound before switching phase
        setTimeout(() => {
            onLaunch();
        }, 2000); // 2 seconds warp effect
    };

    return (
        <div className="flex flex-col items-center justify-between h-full w-full py-12 px-4 z-10 relative">
            {/* HUD Top */}
            <div className="w-full flex justify-between text-terminal-green opacity-80 border-b border-terminal-green/30 pb-4">
                <div className="flex items-center gap-2">
                    <Settings size={16} className="animate-spin-slow" />
                    <span className="text-xs tracking-widest">SYSTEM ONLINE</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs tracking-widest">v2.0.4</span>
                    <Radio size={16} className="animate-pulse" />
                </div>
            </div>

            {/* Center Reactor */}
            <div className="relative flex items-center justify-center">
                {/* Outer Rings */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute w-64 h-64 border border-terminal-green/20 rounded-full border-dashed"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-56 h-56 border-2 border-terminal-green/10 rounded-full"
                />

                {/* Core Button */}
                <button
                    onClick={requestPermission}
                    disabled={isLaunching}
                    className={`relative w-40 h-40 rounded-full flex items-center justify-center group transition-all duration-500 ${isLaunching ? 'scale-150 opacity-0' : 'hover:scale-105'}`}
                >
                    {/* Inner Glow/Core */}
                    <div className="absolute inset-0 bg-terminal-green/10 rounded-full blur-xl group-hover:bg-terminal-green/30 transition-all duration-300" />
                    <div className="absolute inset-2 border-4 border-terminal-green rounded-full opacity-80 group-hover:opacity-100 group-hover:border-white transition-all duration-300" />

                    <div className="flex flex-col items-center text-terminal-green group-hover:text-white transition-colors">
                        <span className="text-2xl font-bold tracking-wider">IGNITION</span>
                        <span className="text-xs mt-1 opacity-70">起動</span>
                    </div>
                </button>
            </div>

            {/* HUD Bottom */}
            <div className="w-full text-center space-y-2">
                <div className="text-terminal-amber text-xs tracking-[0.2em] animate-pulse">
                    WAITING FOR PILOT INPUT...
                </div>
                <div className="flex justify-center gap-8 text-terminal-green/50 text-xs">
                    <span>O2: 100%</span>
                    <span>FUEL: 98%</span>
                    <span>HULL: OK</span>
                </div>
            </div>

            {/* Warp overlay on launch */}
            {isLaunching && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-white z-50 pointer-events-none"
                />
            )}
        </div>
    );
}
