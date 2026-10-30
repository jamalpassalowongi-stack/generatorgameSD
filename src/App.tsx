import React, { useState } from 'react';
import { Header } from './components/Header';
import { PromptGeneratorView } from './components/PromptGeneratorView';
import { PlayableGameView } from './components/PlayableGameView';
import { MultiplayerView } from './components/MultiplayerView';
import { LeaderboardView } from './components/LeaderboardView';
import { GamePackage } from './types/game';
import { OFFLINE_GAME_PRESETS } from './services/offlinePresets';
import { sound } from './services/sound';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'play' | 'multiplayer' | 'leaderboard'>('generator');
  const [isSmartboardMode, setIsSmartboardMode] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);

  // Active game package being played
  const [activeGame, setActiveGame] = useState<GamePackage>(OFFLINE_GAME_PRESETS[0]);

  const handlePlayGame = (gameToPlay: GamePackage) => {
    setActiveGame(gameToPlay);
    setActiveTab('play');
    sound.playVictory();
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white ${
        isSmartboardMode ? 'smartboard-active text-base select-none' : ''
      }`}
    >
      {/* Top Bar strictly meeting the 3-Zone Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSmartboardMode={isSmartboardMode}
        setIsSmartboardMode={setIsSmartboardMode}
        isSoundOn={isSoundOn}
        setIsSoundOn={setIsSoundOn}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'generator' && <PromptGeneratorView onPlayGame={handlePlayGame} />}

        {activeTab === 'play' && (
          <PlayableGameView
            game={activeGame}
            onBackToGenerator={() => setActiveTab('generator')}
            isSmartboardMode={isSmartboardMode}
          />
        )}

        {activeTab === 'multiplayer' && <MultiplayerView initialGame={activeGame} />}

        {activeTab === 'leaderboard' && <LeaderboardView />}
      </main>

      {/* Quiet, clean educational footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 md:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">EduPlay SD</span>
            <span>·</span>
            <span>Media Pembelajaran Interaktif Sekolah Dasar</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Dukungan Smart Board & Layar Sentuh</span>
            <span>·</span>
            <span>Deteksi Gerak Kamera</span>
            <span>·</span>
            <span>100% Offline Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
