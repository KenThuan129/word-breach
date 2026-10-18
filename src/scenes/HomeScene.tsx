import React, { useState } from 'react';
import { Play, Infinity as InfinityIcon, Settings as SettingsIcon } from 'lucide-react';
import { SettingsModal } from '../components/SettingsModal';

interface HomeSceneProps {
  onPlayStandard: () => void;
  onPlayEndless: () => void;
  onPlayMinigame: () => void;
}

export function HomeScene({ onPlayStandard, onPlayEndless, onPlayMinigame }: HomeSceneProps) {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <div className="fixed inset-0 bg-paper-texture overflow-auto flex flex-col items-center justify-center p-6">
      {/* Ambient background decoration */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(244, 213, 141, 0.5) 0%, transparent 60%)',
        }}
      />

      {/* Settings button — top right */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-5 right-5 p-2.5 rounded-xl bg-[#EADFC9] border-2 border-[#8B6F5C] shadow-[0_3px_0_#8B6F5C] hover:bg-[#F4D58D] transition-colors text-[#1A2A3A] active:translate-y-0.5 active:shadow-[0_1px_0_#8B6F5C] z-20"
        aria-label="Settings"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-10 max-w-md w-full my-auto">
        {/* Logo block */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="home-logo-breath w-24 h-24 rounded-2xl flex items-center justify-center font-black text-5xl text-[#1A2A3A]"
            style={{
              background: 'linear-gradient(145deg, #FDF0D5 0%, #F4D58D 100%)',
              border: '3px solid #8B6F5C',
              boxShadow: '0 8px 0 #8B6F5C, 0 12px 28px rgba(74,53,39,0.25)',
            }}
          >
            W
          </div>
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1A2A3A] leading-none">
              WORD - LIBRARIA
            </h1>
            <p className="text-sm sm:text-base text-[#8B6F5C] font-medium mt-2">
              Cozy Indie Word Puzzle
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Primary: Play Standard */}
          <button
            onClick={onPlayStandard}
            className="home-button-enter group w-full py-4 px-6 bg-gradient-to-br from-[#FDF0D5] to-[#F4D58D] border-2 border-[#8B6F5C] rounded-2xl shadow-[0_5px_0_#8B6F5C] hover:shadow-[0_7px_0_#8B6F5C] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#8B6F5C] transition-all flex items-center justify-between gap-3 text-left"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#FFFDF9] border-2 border-[#8B6F5C] flex items-center justify-center shadow-[0_2px_0_#8B6F5C] shrink-0">
                <Play className="w-5 h-5 text-[#D97706] fill-[#D97706]" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-[#1A2A3A] leading-none">
                  PLAY STANDARD
                </div>
                <div className="text-xs text-[#8B6F5C] font-semibold mt-1">
                  20 levels across 4 chapters
                </div>
              </div>
            </div>
            <span className="text-2xl font-black text-[#8B6F5C] group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>

          {/* Secondary: Endless Mode */}
          <button
            onClick={onPlayEndless}
            className="home-button-enter group w-full py-4 px-6 bg-[#FFFDF9] border-2 border-[#8B6F5C] rounded-2xl shadow-[0_5px_0_#8B6F5C] hover:shadow-[0_7px_0_#8B6F5C] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#8B6F5C] transition-all flex items-center justify-between gap-3 text-left"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#E8DCC8] border-2 border-[#8B6F5C] flex items-center justify-center shadow-[0_2px_0_#8B6F5C] shrink-0">
                <InfinityIcon className="w-5 h-5 text-[#8B6F5C]" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-[#1A2A3A] leading-none">
                  ENDLESS MODE
                </div>
                <div className="text-xs text-[#8B6F5C] font-semibold mt-1">
                  Chase your high score
                </div>
              </div>
            </div>
            <span className="text-2xl font-black text-[#8B6F5C] group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>

          {/* === NEW: Minigame Button === */}
            <button
              onClick={onPlayMinigame}
              className="home-button-enter group w-full py-3 px-5 bg-[#FFFDF9] border-2 border-[#8B6F5C] border-dashed rounded-2xl shadow-[0_4px_0_#8B6F5C] hover:shadow-[0_6px_0_#8B6F5C] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_#8B6F5C] transition-all flex items-center justify-between gap-3 text-left"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F5EFE6] border-2 border-[#8B6F5C] flex items-center justify-center text-lg shadow-[0_2px_0_#8B6F5C] shrink-0">
                  🐹
                </div>
                <div>
                  <div className="text-sm font-black text-[#1A2A3A] leading-none">
                    MINIGAME: WORD HOPPERS
                  </div>
                  <div className="text-[11px] text-[#8B6F5C] font-semibold mt-1">
                    Whack letters & chase the high score
                  </div>
                </div>
              </div>
              <span className="text-lg font-black text-[#8B6F5C] group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
        </div>

        {/* Footer credits */}
        <p className="text-[10px] text-[#8B6F5C]/60 font-semibold uppercase tracking-widest text-center">
          v0.1 · Prototype Build
        </p>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}