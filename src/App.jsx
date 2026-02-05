import React, { useState, useRef, useEffect } from 'react';
import IntroPhase from './components/IntroPhase';
import LaunchPhase from './components/LaunchPhase';
import SearchPhase from './components/SearchPhase';
import ClimaxPhase from './components/ClimaxPhase';
import { PHASES, ASSETS } from './constants';

function App() {
  const [phase, setPhase] = useState(PHASES.INTRO);

  // Refs for audio elements to control them programmatically
  const bgmPrologueRef = useRef(null);
  const bgmMoonSearchRef = useRef(null);
  const seTaikiRef = useRef(null);
  const seLaunchRef = useRef(null);
  const seLaunch2Ref = useRef(null); // New ref for chained audio
  const seTouchRef = useRef(null);
  const sePopupRef = useRef(null);

  // Helper to play sound safely
  const playSound = (ref, volume = 1.0, loop = false) => {
    if (ref.current) {
      ref.current.volume = volume;
      ref.current.loop = loop;
      // Reset time to 0 if not playing loop or if restarting? 
      // Usually good for SE, maybe not for BGM if just changing volume.
      // For now, simple play.
      ref.current.currentTime = 0;
      ref.current.play().catch(e => console.log("Audio play failed (user interaction needed?):", e));
    }
  };

  const stopSound = (ref) => {
    if (ref.current) {
      ref.current.pause();
      ref.current.currentTime = 0;
    }
  };

  const fadeOut = (ref, duration = 1500) => {
    if (!ref.current) return;

    // Check if already 0
    if (ref.current.volume <= 0) {
      stopSound(ref);
      return;
    }

    const startVolume = ref.current.volume;
    const steps = 30; // 50ms per step
    const intervalTime = duration / steps;
    const stepAmount = startVolume / steps;

    const fadeInterval = setInterval(() => {
      if (!ref.current) {
        clearInterval(fadeInterval);
        return;
      }

      const newVolume = ref.current.volume - stepAmount;

      if (newVolume <= 0.01) {
        ref.current.volume = 0;
        ref.current.pause();
        clearInterval(fadeInterval);
      } else {
        ref.current.volume = newVolume;
      }
    }, intervalTime);
  };

  // Phase Transitions
  const startIntro = () => {
    // User triggered start - play prologue BGM
    playSound(bgmPrologueRef, 1.0, false);
  };

  const completeIntro = () => {
    setPhase(PHASES.LAUNCH);
    // Intro text done, entering Launch Phase (Ignition button appears).
    // Spec change: Stop Prologue BGM fade out here.
    fadeOut(bgmPrologueRef, 1500);

    // Start Taiki (Idling) loop for the cockpit atmosphere
    playSound(seTaikiRef, 0.6, true);
  };

  const startLaunch = () => {
    // User tapped Launch
    playSound(seTouchRef);

    // Play Launch 1
    playSound(seLaunchRef);

    // Chain Launch 2 after Launch 1 finishes
    if (seLaunchRef.current) {
      seLaunchRef.current.onended = () => {
        playSound(seLaunch2Ref);
      };
    }

    // Stop Prologue (just in case) and Idling sounds
    if (bgmPrologueRef.current) {
      bgmPrologueRef.current.pause();
      bgmPrologueRef.current.volume = 0; // Force silence
    }
    fadeOut(seTaikiRef, 500);

    // Transition happens after delay in component, but we update state here or there?
    // Component has a 2s delay before calling onLaunch. Ideally we wait for that.
    setTimeout(() => {
      setPhase(PHASES.SEARCH);
      // Start Deep Space BGM
      playSound(bgmMoonSearchRef, 1.0, true);
    }, 4500); // Extended wait for longer launch sequence
  };

  const foundTarget = () => {
    // Found moon
    playSound(sePopupRef);
    stopSound(bgmMoonSearchRef); // Or fade out? Spec doesn't specify stopping BGM, but usually for climax we want focus?
    // Let's fade out search BGM to let the mood shift
    fadeOut(bgmMoonSearchRef, 2000);

    setPhase(PHASES.CLIMAX);
  };

  return (
    <div className="w-full h-full bg-black text-white overflow-hidden relative font-mono">
      {/* Cinematic Overlays - Pointer events none to allow clicks through */}
      <div className="scanlines crt-screen absolute inset-0 z-50 pointer-events-none" />
      <div className="vignette absolute inset-0 z-40 pointer-events-none" />

      {/* Hidden Audio Elements */}
      <div style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}>
        <audio ref={bgmPrologueRef} src={ASSETS.BGM_PROLOGUE} preload="auto" />
        <audio ref={bgmMoonSearchRef} src={ASSETS.BGM_MOON_SEARCH} preload="auto" />
        <audio ref={seTaikiRef} src={ASSETS.SE_SPACESHIP_TAIKI} preload="auto" />
        <audio ref={seLaunchRef} src={ASSETS.SE_SPACESHIP_LAUNCH} preload="auto" />
        <audio ref={seLaunch2Ref} src={ASSETS.SE_SPACESHIP_LAUNCH2} preload="auto" />
        <audio ref={seTouchRef} src={ASSETS.SE_TOUCH} preload="auto" />
        <audio ref={sePopupRef} src={ASSETS.SE_POPUP} preload="auto" />
      </div>

      {/* Main Content Layer - z-index below overlays but interactive */}
      <div className="relative z-10 w-full h-full">
        {phase === PHASES.INTRO && (
          <IntroPhase onStart={startIntro} onComplete={completeIntro} />
        )}

        {phase === PHASES.LAUNCH && (
          <LaunchPhase onLaunch={startLaunch} />
        )}

        {phase === PHASES.SEARCH && (
          <SearchPhase onFound={foundTarget} />
        )}

        {phase === PHASES.CLIMAX && (
          <ClimaxPhase />
        )}
      </div>
    </div>
  );
}

export default App;
