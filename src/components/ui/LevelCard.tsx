import React from 'react';
import { Lock, Check, Play } from 'lucide-react';
import { LevelDefinition, DifficultyTier } from '../../game/types';
import { LevelProgress } from '../../game/storage';

interface LevelCardProps {
  level: LevelDefinition;
  progress: LevelProgress | undefined;
  unlocked: boolean;
  onClick: () => void;
}

const TIER_STYLES: Record<
  DifficultyTier,
  { bg: string; border: string; badgeBg: string; badgeText: string }
> = {
  easy: {
    bg: 'linear-gradient(145deg, #FDF6EC 0%, #D4EFD8 100%)',
    border: '#A8D5BA',
    badgeBg: '#A8D5BA',
    badgeText: '#0F4A2B',
  },
  medium: {
    bg: 'linear-gradient(145deg, #FDF6EC 0%, #F9E4A8 100%)',
    border: '#F4D58D',
    badgeBg: '#F4D58D',
    badgeText: '#7A4A00',
  },
  hard: {
    bg: 'linear-gradient(145deg, #FDF6EC 0%, #F4C3A5 100%)',
    border: '#E89B7B',
    badgeBg: '#E89B7B',
    badgeText: '#7A2E00',
  },
  insane: {
    bg: 'linear-gradient(145deg, #FDF6EC 0%, #F4A69A 100%)',
    border: '#E76F51',
    badgeBg: '#E76F51',
    badgeText: '#5C1500',
  },
};

const MODE_ICONS: Record<string, string> = {
  'secret-password': '🔐',
  battle: '⚔️',
  course: '🧭',
  morse: '📡',
  endless: '∞',
};

export function LevelCard({ level, progress, unlocked, onClick }: LevelCardProps) {
  const tier = TIER_STYLES[level.tier];
  const stars = progress?.stars ?? 0;
  const completed = progress?.completed ?? false;
  const bestScore = progress?.bestScore ?? 0;

  return (
    <button
      onClick={onClick}
      disabled={!unlocked}
      className={`relative flex flex-col items-start gap-1 p-3 rounded-2xl border-2 border-[#8B6F5C] shadow-[0_4px_0_#8B6F5C] transition-all text-left w-full min-h-[110px] ${
        unlocked
          ? 'active:translate-y-1 active:shadow-[0_1px_0_#8B6F5C] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#8B6F5C] cursor-pointer'
          : 'cursor-not-allowed'
      }`}
      style={{
        background: unlocked ? tier.bg : '#EFE7DA',
        opacity: unlocked ? 1 : 0.6,
      }}
    >
      {/* Top row: level number + mode icon */}
      <div className="flex items-center justify-between w-full">
        <span
          className="text-2xl font-black leading-none text-[#1A2A3A]"
          style={{ letterSpacing: '-0.05em' }}
        >
          {String(level.id).padStart(2, '0')}
        </span>
        <span className="text-xl leading-none">{MODE_ICONS[level.mode] ?? '❓'}</span>
      </div>

      {/* Title */}
      <span className="text-[11px] font-bold text-[#1A2A3A] leading-tight line-clamp-2 mt-0.5">
        {level.title}
      </span>

      {/* Bottom: stars + status */}
      <div className="flex items-center justify-between w-full mt-auto pt-1.5">
        {/* Stars */}
        <div className="flex gap-0.5">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className="text-[10px] leading-none"
              style={{ opacity: s <= stars ? 1 : 0.25 }}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Status indicator */}
        {!unlocked ? (
          <Lock className="w-3.5 h-3.5 text-[#8B6F5C]" />
        ) : completed ? (
          <Check className="w-3.5 h-3.5 text-[#0F4A2B]" strokeWidth={3} />
        ) : (
          <Play className="w-3 h-3 text-[#D97706] fill-[#D97706]" />
        )}
      </div>

      {/* Best score (small) */}
      {completed && bestScore > 0 && (
        <span className="absolute bottom-1 right-2 text-[9px] font-bold text-[#8B6F5C]/70">
          {bestScore}
        </span>
      )}
    </button>
  );
}