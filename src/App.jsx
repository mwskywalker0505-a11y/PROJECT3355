import React, { useState, useEffect } from 'react';
import IntroPhase from './components/IntroPhase';
import LaunchPhase from './components/LaunchPhase';
import SearchPhase from './components/SearchPhase';
import ClimaxPhase from './components/ClimaxPhase';
import { PHASES, ASSETS } from './constants';
import { audioManager } from './utils/AudioManager';

function App() {
  const [phase, setPhase] = useState(PHASES.INTRO);

  // Initialize Audio Logic
  useEffect(() => {
    // Preload all audio assets
    audioManager.loadAll();
  }, []);

  // Phase Transitions
  const startIntro = () => {
    // User interaction is required to unlock AudioContext
    audioManager.resume();
    // Play prologue BGM
    audioManager.play(ASSETS.BGM_PROLOGUE, false, 1.0);
  };

  const completeIntro = () => {
    setPhase(PHASES.LAUNCH);
    // Intro text done, entering Launch Phase.
    // Trigger fadeout when button appears (Launch phase start)
    console.log("Intro complete - fading out BGM (Web Audio)");
    // 1.5s fadeout - This should work on iOS now thanks to Web Audio API
    audioManager.fadeOut(ASSETS.BGM_PROLOGUE, 1.5);

    // Start Taiki (Idling) loop for the cockpit atmosphere
    audioManager.play(ASSETS.SE_SPACESHIP_TAIKI, true, 0.6);
  };

  const startLaunch = () => {
    // User tapped Launch - Resume again just to be safe
    audioManager.resume();

    // Play Launch
    audioManager.play(ASSETS.SE_TOUCH);

    // Chain Launch 2 after Launch 1 finishes
    audioManager.play(ASSETS.SE_SPACESHIP_LAUNCH, false, 1.0, () => {
      // Redundant kill for Prologue BGM
      audioManager.stop(ASSETS.BGM_PROLOGUE);
      audioManager.play(ASSETS.SE_SPACESHIP_LAUNCH2);
    });

    // Stop Prologue (just in case) and Idling sounds
    audioManager.stop(ASSETS.BGM_PROLOGUE);

    // Fade out idling sound quickly
    audioManager.fadeOut(ASSETS.SE_SPACESHIP_TAIKI, 0.5);

    // Transition happens after delay
    setTimeout(() => {
      setPhase(PHASES.SEARCH);
      // Start Deep Space BGM
      audioManager.play(ASSETS.BGM_MOON_SEARCH, true, 1.0);
    }, 4500);
  };

  const foundTarget = () => {
    // Found moon
    audioManager.play(ASSETS.SE_POPUP);

    // Fade out search BGM
    audioManager.fadeOut(ASSETS.BGM_MOON_SEARCH, 2.0);

    setPhase(PHASES.CLIMAX);
  };

  return (
    <div className="w-full h-full bg-black text-white overflow-hidden relative font-mono">
      {/* Cinematic Overlays - Pointer events none to allow clicks through */}
      <div className="scanlines crt-screen absolute inset-0 z-50 pointer-events-none" />
      <div className="vignette absolute inset-0 z-40 pointer-events-none" />

      {/* Main Content Layer - z-index below overlays but interactive */}
      <div className="relative z-10 w-full h-full">
        {phase === PHASES.INTRO && (
          <IntroPhase
            onStart={startIntro}
            onComplete={completeIntro}
          />
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
