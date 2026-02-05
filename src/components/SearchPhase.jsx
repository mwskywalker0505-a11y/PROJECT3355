import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

// Shortest distance between two angles (degrees)
const getAngleDistance = (target, current) => {
    let diff = target - current;
    // Normalize to -180 to 180
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    return diff;
};

const HIT_TOLERANCE = 12; // Degrees

export default function SearchPhase({ onFound }) {
    // Current device orientation
    const [orientation, setOrientation] = useState({ alpha: 0, beta: 90, gamma: 0 });
    // Target position (randomized on mount)
    const [target, setTarget] = useState({ alpha: 0, beta: 0 });
    const [found, setFound] = useState(false);

    // Determining if we have initial orientation to set relative target
    const [calibrated, setCalibrated] = useState(false);

    // Guide Helpers
    const [distance, setDistance] = useState(100);
    const [arrowAngle, setArrowAngle] = useState(0);

    const layer1Ref = useRef(null);

    useEffect(() => {
        // Randomize target relative to "Front" which we don't know yet, 
        // but we can just pick random spherical coordinates.
        // Alpha: 0-360, Beta: 20-100 (Sky area usually)
        setTarget({
            alpha: Math.random() * 360,
            beta: 30 + Math.random() * 60 // 30 (high up) to 90 (horizon)
        });
    }, []);

    useEffect(() => {
        const handleOrientation = (event) => {
            // Alpha: Rotation around Z axis (0-360) - Direction user is facing
            // Beta: Rotation around X axis (-180 to 180) - Tilt front/back
            // Gamma: Rotation around Y axis (-90 to 90) - Tilt left/right

            // iOS Webkit specific handling for alpha might be needed if start offset is weird,
            // but for a game we can adapt.
            const alpha = event.alpha || 0;
            const beta = event.beta || 90;
            const gamma = event.gamma || 0;

            setOrientation({ alpha, beta, gamma });

            if (!calibrated && event.alpha !== null) {
                setCalibrated(true);
            }

            // Calculate diffs
            const dAlpha = getAngleDistance(target.alpha, alpha); // Horizontal diff
            const dBeta = target.beta - beta; // Vertical diff

            // Distance (Euclidean approximate on sphere surface for small segments)
            const dist = Math.sqrt(dAlpha * dAlpha + dBeta * dBeta);
            setDistance(dist);

            // Arrow Angle
            // dAlpha > 0 means target is to the RIGHT (clockwise)
            // dBeta > 0 means target is UPPER/LOWER? 
            // Beta 90 is upright. Beta 0 is flat on table. Beta 180 is upside down.
            // If phone is upright (90) and target is sky (45), dBeta = 45 - 90 = -45.
            // So negative dBeta means "Look Up".

            // Screen coordinates: 
            // Target X = -dAlpha (if I turn right (alpha inc), target moves left)
            // Target Y = dBeta (if I tilt up (beta dec), target moves down... wait)

            // Let's think pure Arrow direction:
            // If dAlpha is +90 (Target is right), Arrow should point Right (90deg).
            // If dBeta is -45 (Target is Up), Arrow should point Up (0deg).

            // atan2(y, x). 
            // In screen space (Y down): Up is -Y. Right is +X.
            // Target relative pos: X = dAlpha, Y = dBeta (approx mapping)
            // If dAlpha is positive (Target East), we want arrow right.
            // If dBeta is negative (Target Higher), we want arrow up.

            // Math.atan2(y, x). 0 is Right in math.
            // CSS Rotate: 0 is Up (if using default icon orientation).
            // Actually usually 0 is Up for icons.

            // Let's map delta to screen vector for the arrow:
            // If dAlpha > 0 (Right), Vector X should be positive.
            // If dBeta < 0 (Up), Vector Y should be negative.

            const vecX = dAlpha;
            const vecY = dBeta;

            // Angle from Up (0 deg)
            // atan2(x, -y) gives angle from North (0, -1) clockwise? 
            // Let's stick to standard trig + offset.
            // atan2(y, x) -> 0 is +X (Right). 
            // We want 0 to be Up (-Y). 
            // So Up is -90 deg in trig.
            const rad = Math.atan2(vecY, vecX);
            const deg = rad * (180 / Math.PI);
            // Rotated so that -90 (Up) becomes 0.
            setArrowAngle(deg + 90);
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [target, calibrated]);

    // Check visibility
    const moonVisible = distance < HIT_TOLERANCE * 1.5; // Slightly lenient visibility

    const handleLockComplete = () => {
        if (!found) {
            setFound(true);
            onFound();
        }
    };

    // Screen Position Calculation
    // We want the moon to stay fixed in "world space"
    // Screen X offset = -(TargetAlpha - CurrentAlpha) * Scale
    // Scale: Pixels per degree. iPhone width ~375. FOV ~60? 
    // 375 / 60 = ~6px per degree. Let's use larger for dramatic effect or accurate for usability.
    // Making it 12px per degree implies ~30 deg visible width.
    const SCALE = 15;
    const dAlpha = getAngleDistance(target.alpha, orientation.alpha);
    const dBeta = target.beta - orientation.beta;

    // If dAlpha is positive (Target is to the Right/East), it should appear at Positive X?
    // No, if Target is East (90) and I face North (0), Target is to my Right.
    // Screen coordinates: Center + Offset.
    // Offset X = +90 * Scale. Yes.
    const moonX = dAlpha * SCALE;
    const moonY = dBeta * SCALE;

    // Star parallax (Infinite distance, just moves based on orientation)
    // We can just wrap the texture.
    const bgX = orientation.alpha * 5; // 5px per degree
    const bgY = orientation.beta * 5;

    return (
        <div className="relative w-full h-full overflow-hidden bg-black transition-all duration-1000 ease-out">
            {/* Instruction Message */}
            {!found && (
                <div className="absolute top-20 left-0 w-full text-center z-50 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="bg-black/50 backdrop-blur-sm py-2 px-6 inline-block rounded-full border border-terminal-green/30"
                    >
                        <p className="text-terminal-green font-mono text-sm tracking-widest animate-pulse">
                            SCANNING SECTOR...
                        </p>
                        <p className="text-white text-xs mt-1 font-sans">
                            体を回して、月を探してください
                        </p>
                    </motion.div>
                </div>
            )}

            {/* Directional Guide (Arrow) */}
            {!found && distance > 25 && (
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 transition-opacity duration-500"
                    style={{ opacity: Math.min(1, Math.max(0, (distance - 20) / 20)) }}
                >
                    <motion.div
                        className="w-24 h-24 rounded-full border border-terminal-green/20 flex items-center justify-center"
                        animate={{ rotate: arrowAngle }}
                        transition={{ type: "spring", stiffness: 40, damping: 10 }}
                    >
                        <ChevronUp className="text-terminal-green w-8 h-8 animate-bounce-slow" />
                    </motion.div>
                    <div className="absolute mt-32 text-terminal-green/50 text-[10px] font-mono bg-black/50 px-2 rounded">
                        SIGNAL: {(100 - Math.min(100, distance)).toFixed(0)}%
                    </div>
                </div>
            )}

            {/* Background - Tiled Stars that move with parallax */}
            {/* Using a larger container that shifts */}
            <div
                className="absolute inset-[-100%] will-change-transform opacity-50"
                style={{
                    transform: `translate3d(${-bgX % 1000}px, ${bgY % 1000}px, 0)`,
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
                    backgroundRepeat: 'repeat'
                }}
            />
            {/* Additional star layers for depth */}
            <div
                className="absolute inset-[-100%] will-change-transform opacity-70"
                style={{
                    transform: `translate3d(${-bgX * 1.5 % 1500}px, ${bgY * 1.5 % 1500}px, 0)`
                }}
            >
                {[...Array(40)].map((_, i) => (
                    <div key={`star-${i}`} className="absolute bg-white rounded-full"
                        style={{
                            width: Math.random() * 2 + 'px',
                            height: Math.random() * 2 + 'px',
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random()
                        }}
                    />
                ))}
            </div>

            {/* The Moon */}
            <div
                className="absolute top-1/2 left-1/2 w-64 h-64 -ml-32 -mt-32 rounded-full cursor-none will-change-transform group"
                style={{
                    transform: `translate3d(${moonX}px, ${moonY}px, 0)`,
                    visibility: (Math.abs(moonX) > window.innerWidth || Math.abs(moonY) > window.innerHeight) ? 'hidden' : 'visible'
                }}
            >
                <div className={`relative w-full h-full transition-all duration-300 ${moonVisible ? 'brightness-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'brightness-50 opacity-40'}`}>
                    <img src="/moon.png" alt="Moon" className="w-full h-full object-contain mix-blend-screen" />

                    {/* Locking UI */}
                    {moonVisible && !found && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-80 h-80 animate-spin-slow opacity-80" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="#33ff00" strokeWidth="0.5" strokeDasharray="4 2" />
                            </svg>

                            <div className="absolute w-72 h-72 border border-terminal-green/30 rounded-full" />

                            <div className="absolute top-full mt-4 text-terminal-green text-xs font-mono tracking-widest text-center">
                                LOCKING TARGET...
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3.0, ease: "linear" }}
                                    onAnimationComplete={handleLockComplete}
                                    className="h-1 bg-terminal-green mt-1"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-8 h-8 border border-terminal-green/50" />
                <div className="absolute w-12 h-[1px] bg-terminal-green/50" />
                <div className="absolute h-12 w-[1px] bg-terminal-green/50" />
            </div>

            {/* Debug Info (Optional) */}
            {/* <div className="absolute bottom-4 left-4 text-[10px] text-terminal-green/40 font-mono pointer-events-none">
                A: {orientation.alpha.toFixed(0)} B: {orientation.beta.toFixed(0)} <br/>
                T_A: {target.alpha.toFixed(0)} T_B: {target.beta.toFixed(0)}
            </div> */}
        </div>
    );
}
