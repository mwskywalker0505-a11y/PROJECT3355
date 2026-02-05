import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ClimaxPhase() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-black z-10 relative overflow-hidden">
            {/* Centered Moon Zoom Effect */}
            <motion.div
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 20], opacity: [0, 1, 0] }}
                transition={{ duration: 4, times: [0, 0.2, 1] }}
                className="absolute w-32 h-32 bg-slate-200 rounded-full blur-md"
            />

            <div className="z-20 text-center space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 2 }}
                    className="text-white text-3xl font-light tracking-[0.3em] uppercase"
                >
                    Mission Complete
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4, duration: 2 }}
                    className="text-terminal-green text-sm tracking-widest"
                >
                    I found you.
                    <br />
                    <span className="text-[10px] opacity-60">見つけた</span>
                </motion.div>
            </div>

            {/* Star shower or final effect */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ delay: 3, duration: 2 }}
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-black to-black"
            />
        </div>
    );
}
