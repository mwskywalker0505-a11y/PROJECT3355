import React, { useState, useEffect } from 'react';
import IntroPhase from './components/IntroPhase';
import LaunchPhase from './components/LaunchPhase';
import SearchPhase from './components/SearchPhase';
import ClimaxPhase from './components/ClimaxPhase';
import { PHASES, ASSETS } from './constants';
import { audioManager } from './utils/AudioManager';

function App() {
  const [phase, setPhase] = useState(PHASES.INTRO);

  useEffect(() => {
    // Preload audio
    audioManager.loadAll();
  }, []);

  const startIntro = () => {
    audioManager.resume();
    audioManager.play(ASSETS.BGM_PROLOGUE, false, 1.0);
  };

  const completeIntro = () => {
    setPhase(PHASES.LAUNCH);
    if (audioManager.gains[ASSETS.BGM_PROLOGUE]) {
      const currentTime = audioManager.ctx.currentTime;
      audioManager.gains[ASSETS.BGM_PROLOGUE].gain.setTargetAtTime(0.3, currentTime, 1);
    }
    audioManager.play(ASSETS.SE_SPACESHIP_TAIKI, true, 1.5);
  };

  const startLaunch = () => {
    audioManager.resume();
    // audioManager.play(ASSETS.SE_TOUCH); // Moved to LaunchPhase onPointerDown for zero latency

    // Play Launch SE, then chain next sound
    audioManager.play(ASSETS.SE_SPACESHIP_LAUNCH, false, 1.0, () => {
      audioManager.play(ASSETS.SE_SPACESHIP_LAUNCH2);
    });

    // Fade out previous BGM and Ambience
    audioManager.fadeOut(ASSETS.BGM_PROLOGUE, 1.0);
    audioManager.fadeOut(ASSETS.SE_SPACESHIP_TAIKI, 1.0);

    // Wait for animation/SFX
    setTimeout(() => {
      setPhase(PHASES.SEARCH);
      audioManager.play(ASSETS.BGM_MOON_SEARCH, true, 0.8);
      // Play ambient search sound (Loop) - Increased volume
      audioManager.play(ASSETS.SE_MOON_SEARCH2, true, 1.2);
    }, 4000);
  };

  const foundTarget = () => {
    audioManager.play(ASSETS.SE_POPUP);
    audioManager.fadeOut(ASSETS.BGM_MOON_SEARCH, 3.0);
    audioManager.fadeOut(ASSETS.SE_MOON_SEARCH2, 3.0);
    setPhase(PHASES.CLIMAX);
  };

  return (
    <div className="w-full h-full bg-black text-white overflow-hidden relative font-mono">
      {/* Visual Overlays - Disable during Search Phase for clean look */}
      {phase !== PHASES.SEARCH && (
        <>
          <div className="scanlines crt-screen absolute inset-0 z-50 pointer-events-none" />
          <div className="vignette absolute inset-0 z-40 pointer-events-none" />
        </>
      )}

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
