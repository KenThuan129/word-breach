import React, { useMemo } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { JOURNEY_LEVELS, getLevelsByChapter } from '../game/level';
import { getProgress, isLevelUnlocked } from '../game/storage';
import { LevelCard } from '../components/ui/LevelCard';
import { ChapterHeader } from '../components/ui/ChapterHeader';
import { DifficultyTier } from '../game/types';

interface StandardMenuSceneProps {
  onBack: () => void;
  onSelectLevel: (levelId: number) => void;
}

export function StandardMenuScene({ onBack, onSelectLevel }: StandardMenuSceneProps) {
  // Compute progress once on mount (component re-mounts when returning from a level)
  const progress = useMemo(() => getProgress(), []);

  const chapters = [1, 2, 3, 4];
  const totalStars = progress.totalStars;
  const maxStars = JOURNEY_LEVELS.length * 3;

  return (
    <div className="w-full h-full bg-paper-texture overflow-y-auto relative">
      {/* Ambient background */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(244, 213, 141, 0.5) 0%, transparent 50%)',
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-5 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFDF9] border-2 border-[#8B6F5C] rounded-xl shadow-[0_2px_0_#8B6F5C] hover:bg-[#F4D58D] active:translate-y-0.5 active:shadow-[0_1px_0_#8B6F5C] transition-colors text-xs font-bold text-[#1A2A3A]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-[#8B6F5C] uppercase tracking-widest">
              Journey
            </span>
            <h2
              className="text-2xl sm:text-3xl font-black leading-none text-[#1A2A3A]"
              style={{ letterSpacing: '-0.03em' }}
            >
              STANDARD MODE
            </h2>
          </div>
        </div>

        {/* Total stars badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FFFDF9] border-2 border-[#8B6F5C] rounded-2xl shadow-[0_3px_0_#8B6F5C]">
            <Trophy className="w-4 h-4 text-[#D97706]" />
            <span className="text-sm font-black text-[#1A2A3A]">
              {totalStars}
              <span className="text-[#8B6F5C] font-bold"> / {maxStars} ⭐</span>
            </span>
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-8">
          {chapters.map((chapterNum) => {
            const levels = getLevelsByChapter(chapterNum);
            const tier = levels[0]?.tier as DifficultyTier;
            const completedCount = levels.filter(
              (l) => progress.levels[l.id]?.completed
            ).length;

            return (
              <section key={chapterNum}>
                <ChapterHeader
                  chapter={chapterNum}
                  tier={tier}
                  totalLevels={levels.length}
                  completedLevels={completedCount}
                />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {levels.map((level) => (
                    <LevelCard
                      key={level.id}
                      level={level}
                      progress={progress.levels[level.id]}
                      unlocked={isLevelUnlocked(level.id)}
                      onClick={() => onSelectLevel(level.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}