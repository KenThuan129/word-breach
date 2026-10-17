import React from 'react';
import { DifficultyTier } from '../../game/types';
import { CHAPTER_INFO } from '../../game/level';

interface ChapterHeaderProps {
  chapter: number;
  tier: DifficultyTier;
  totalLevels: number;
  completedLevels: number;
}

export function ChapterHeader({
  chapter,
  tier,
  totalLevels,
  completedLevels,
}: ChapterHeaderProps) {
  const info = CHAPTER_INFO[chapter as 1 | 2 | 3 | 4];

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border-2 border-[#8B6F5C] shadow-[0_2px_0_#8B6F5C]"
          style={{ backgroundColor: info.color }}
        >
          {info.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#8B6F5C] uppercase tracking-widest">
              Chapter {chapter}
            </span>
          </div>
          <h3
            className="text-lg font-black leading-none text-[#1A2A3A]"
            style={{ letterSpacing: '-0.03em' }}
          >
            {info.name}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-[#FFFDF9] border-2 border-[#8B6F5C] rounded-xl px-2.5 py-1 shadow-[0_2px_0_#8B6F5C]">
        <span className="text-xs font-black text-[#1A2A3A]">
          {completedLevels}/{totalLevels}
        </span>
      </div>
    </div>
  );
}