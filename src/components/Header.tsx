import React from 'react';
import { Sparkles, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../services/sound';

interface HeaderProps {
  activeTab: 'generator' | 'play' | 'multiplayer' | 'leaderboard';
  setActiveTab: (tab: 'generator' | 'play' | 'multiplayer' | 'leaderboard') => void;
  isSmartboardMode: boolean;
  setIsSmartboardMode: (val: boolean) => void;
  isSoundOn: boolean;
  setIsSoundOn: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isSmartboardMode,
  setIsSmartboardMode,
  isSoundOn,
  setIsSoundOn,
}) => {
  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsSmartboardMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsSmartboardMode(false);
    }
  };

  const toggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    sound.enabled = next;
    if (next) sound.playClick();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between gap-8 transition-all">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#generator"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('generator');
          }}
          className="text-lg md:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 whitespace-nowrap shrink-0 hover:text-indigo-600 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>EduPlay SD</span>
        </a>
      </div>

      {/* Zone 2: 4 Single-line Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('generator');
          }}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'generator'
              ? 'text-indigo-600 border-indigo-600 font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Generator Prompt
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('play');
          }}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'play'
              ? 'text-indigo-600 border-indigo-600 font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Mainkan Game
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('multiplayer');
          }}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'multiplayer'
              ? 'text-indigo-600 border-indigo-600 font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Duel Kelas
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('leaderboard');
          }}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'leaderboard'
              ? 'text-indigo-600 border-indigo-600 font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Papan Juara
        </button>
      </nav>

      {/* Zone 3: Primary Action & Utilities */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleSound}
          title={isSoundOn ? 'Matikan Suara' : 'Nyalakan Suara'}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle Sound"
        >
          {isSoundOn ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
        </button>

        <button
          onClick={toggleFullscreen}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0 ${
            isSmartboardMode
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isSmartboardMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span>{isSmartboardMode ? 'Keluar Smart Board' : 'Mode Smart Board'}</span>
        </button>
      </div>
    </header>
  );
};
