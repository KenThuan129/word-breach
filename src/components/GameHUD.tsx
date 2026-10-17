import React from 'react';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Trophy, Clock } from 'lucide-react';
import { DifficultyPhase } from '../game/difficulty';
import { PHASE_CONFIGS } from '../game/difficulty';

interface GameHUDProps {
  score: number;
  highScore: number;
  combo: number;
  comboTimeLeft: number;
  comboWindowMs: number;
  phase: DifficultyPhase;
  timeLeftSec: number | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function GameHUD({
  score,
  highScore,
  combo,
  comboTimeLeft,
  comboWindowMs,
  phase,
  timeLeftSec,
  isMuted,
  onToggleMute,
  onRestart,
  onExit,
}: GameHUDProps) {
  const phaseInfo = PHASE_CONFIGS[phase];
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-xl flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Back + Phase */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-[#FFFDF9] border-2 border-[#8B6F5C] shadow-[0_2px_0_#8B6F5C] hover:bg-[#F4D58D] active:translate-y-0.5 active:shadow-[0_1px_0_#8B6F5C] text-[#1A2A3A] transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="phase-badge flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-[#8B6F5C] shadow-[0_2px_0_#8B6F5C] bg-[#FFFDF9]">
            <span className="text-[11px] leading-none">{phaseInfo.icon}</span>
            <span className="text-[10px] font-bold text-[#1A2A3A] uppercase tracking-wide leading-none">
              {phaseInfo.name}
            </span>
          </div>
        </div>

        {/* Right: Timer + Mute + Restart */}
        <div className="flex items-center gap-2">
          {timeLeftSec !== null && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 shadow-[0_2px_0_#8B6F5C] ${
                timeLeftSec < 30
                  ? 'bg-[#FEE2E2] border-[#DC2626] shadow-[0_2px_0_#DC2626]'
                  : 'bg-[#FFFDF9] border-[#8B6F5C]'
              }`}
            >
              <Clock
                className={`w-3.5 h-3.5 ${
                  timeLeftSec < 30 ? 'text-[#DC2626]' : 'text-[#D97706]'
                }`}
              />
              <span
                className={`text-xs font-black tabular-nums ${
                  timeLeftSec < 30 ? 'text-[#DC2626]' : 'text-[#1A2A3A]'
                }`}
              >
                {formatTime(timeLeftSec)}
              </span>
            </div>
          )}

          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-[#EADFC9] border-2 border-[#8B6F5C] shadow-[0_2px_0_#8B6F5C] hover:bg-[#F4D58D] active:translate-y-0.5 active:shadow-[0_1px_0_#8B6F5C] text-[#1A2A3A] transition-colors"
            aria-label="Toggle sound"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#8B6F5C]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#1A2A3A]" />
            )}
          </button>

          <button
            onClick={onRestart}
            className="p-2 rounded-xl bg-[#EADFC9] border-2 border-[#8B6F5C] shadow-[0_2px_0_#8B6F5C] hover:bg-[#F4D58D] active:translate-y-0.5 active:shadow-[0_1px_0_#8B6F5C] text-[#1A2A3A] transition-colors"
            aria-label="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Score & combo bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-baseline gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#8B6F5C] font-semibold block">
              Score
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[#1A2A3A] leading-none">
              {score}
            </span>
          </div>
          <div className="border-l border-[#8B6F5C]/30 pl-3">
            <span className="text-[10px] uppercase tracking-wider text-[#8B6F5C]/80 font-medium block flex items-center gap-1">
              <Trophy className="w-3 h-3 text-[#D97706]" /> Best
            </span>
            <span className="text-base sm:text-lg font-bold tabular-nums text-[#8B6F5C] leading-none">
              {highScore}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#8B6F5C]">COMBO</span>
            <span
              className={`text-lg sm:text-xl font-extrabold tabular-nums transition-transform ${
                combo > 1 ? 'text-[#E89B7B] scale-110' : 'text-[#8B6F5C]/60'
              }`}
            >
              x{combo}
            </span>
          </div>
          <div className="w-24 h-2 bg-[#EADFC9] rounded-full border border-[#8B6F5C]/40 overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-[#F4D58D] to-[#E89B7B] transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${(comboTimeLeft / comboWindowMs) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}