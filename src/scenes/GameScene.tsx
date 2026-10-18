import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { GameMode, GridType } from '../game/types';
import { getLevelById } from '../game/level';
import { useGameEngine } from '../game/useGameEngine';
import { GameBoard } from '../components/GameBoard';
import { GameHUD } from '../components/GameHUD';
import { SecretPasswordCard } from '../components/SecretPasswordCard';
import { SOUND } from '../game/sound';
import { completeLevel } from '../game/storage';
import { Home, Sparkles, Grid3X3, Hexagon } from 'lucide-react';
import { WordPreviewBar } from '../components/WordPreviewBar';

interface GameSceneProps {
  mode: GameMode;
  level?: number;
  onExit: () => void;
}

export function GameScene({ mode, level, onExit }: GameSceneProps) {
  const levelDef = level !== undefined ? getLevelById(level) : undefined;
  const [gridType, setGridType] = useState<GridType>('square');
  const [isMuted, setIsMuted] = useState<boolean>(SOUND.getMuted());
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [victoryScore, setVictoryScore] = useState<number>(0);

  // Thêm state trong GameScene:
  const [magicWandUses, setMagicWandUses] = useState(3);
  const [bombUses, setBombUses] = useState(2);
    // Lắng nghe cài đặt Suggestion từ localStorage
  const [showSuggestions, setShowSuggestions] = useState(() => {
    return localStorage.getItem('wb_enable_suggestions') !== 'false';
  });

  useEffect(() => {
    const handleToggle = () => {
      setShowSuggestions(localStorage.getItem('wb_enable_suggestions') !== 'false');
    };
    window.addEventListener('suggestionToggle', handleToggle);
    return () => window.removeEventListener('suggestionToggle', handleToggle);
  }, []);

  const levelConfig = useMemo(
    () => ({
      password: levelDef?.config?.password as string | undefined,
      timeLimitSec: levelDef?.timeLimitSec,
    }),
    [levelDef?.config?.password, levelDef?.timeLimitSec]
  );

  const engine = useGameEngine({
    mode,
    levelConfig,
    gridType,
    onVictory: (finalScore) => {
      setVictoryScore(finalScore);
      setShowVictoryModal(true);
      if (levelDef) {
        completeLevel(levelDef.id, finalScore, 300);
      }
    },
    onDefeat: () => {
      // Auto handled by gameOver state
    },
  });

  const handleToggleMute = () => {
    const muted = SOUND.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="w-full h-full bg-paper-texture overflow-y-auto">
      {/* Thêm pt-4, pb-8 để có khoảng thở trên dưới */}
      <div className="min-h-full flex flex-col items-center justify-start p-4 gap-4 max-w-xl mx-auto">
        
        {/* 1. HUD (Score, Timer, Phase) */}
        <GameHUD
          score={engine.score}
          highScore={engine.highScore}
          combo={engine.combo}
          comboTimeLeft={engine.comboTimeLeft}
          comboWindowMs={1000 * 7}
          phase={engine.difficultyPhase}
          timeLeftSec={engine.timeLeftSec}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onRestart={engine.handleRestart}
          onExit={onExit}
        />

        {/* 2. Thanh Preview (Thanh trắng) */}
        <WordPreviewBar currentWord={engine.currentWord} combo={engine.combo} />

        {/* 3. Level info (nếu có) */}
        {levelDef && (
          <div className="w-full flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-bold text-[#8B6F5C] uppercase tracking-widest">
                Level {levelDef.id}
              </p>
              <p className="text-base font-black text-[#1A2A3A] leading-none">
                {levelDef.title}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className="text-xs"
                  style={{ opacity: s <= levelDef.difficulty ? 1 : 0.2 }}
                >
                  🔥
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 4. Secret Password card */}
        {mode === 'secret-password' && engine.passwordTarget && (
          <SecretPasswordCard
            target={engine.passwordTarget}
            unlockedLetters={engine.passwordProgress}
            hint={(levelDef?.config?.hint as string | undefined) ?? undefined}
          />
        )}

        {/* 5. Shuffle Toast */}
        {engine.shuffleToast && (
          <div className="w-full bg-[#F4D58D] border-2 border-[#8B6F5C] rounded-xl px-3 py-1.5 text-center text-sm font-bold text-[#1A2A3A] shadow-[0_2px_0_#8B6F5C] animate-bounce">
            {engine.shuffleToast}
          </div>
        )}

        {/* 6. Board */}
        <div className="w-full flex justify-center">
          <GameBoard
            grid={engine.grid}
            gridType={gridType}
            isProcessing={engine.isProcessing}
            selectedPositions={engine.selectedPositions}
            invalidPositions={engine.invalidPositions}
            scorePopups={engine.scorePopups}
            particles={engine.particles}
            boardRef={engine.boardRef}
            onPointerDown={engine.handlePointerDown}
            onPointerMove={engine.handlePointerMove}
            onPointerUp={engine.handlePointerUp}
            getDragLinePoints={engine.getDragLinePoints}
            isDragging={false}
            explosionEffect={engine.explosionEffect}
          />
        </div>

        {/* 7. KHU VỰC DƯỚI BOARD (Booster Tray + Chế độ chơi + Gợi ý) */}
        <div className="w-full flex flex-col gap-3 mt-1">
          
          {/* Booster Tray */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                if (magicWandUses > 0) {
                  const success = engine.useMagicWand();
                  if (success) setMagicWandUses(prev => prev - 1);
                }
              }}
              disabled={magicWandUses <= 0}
              className={`flex flex-col items-center justify-center p-2 w-14 h-14 rounded-xl border-2 shadow-[0_3px_0_#8B6F5C] transition-all ${
                magicWandUses > 0 ? 'bg-[#F4D58D] hover:bg-[#F7B267]' : 'bg-gray-300 opacity-50'
              }`}
            >
              <span className="text-xl">🪄</span>
              <span className="text-[10px] font-black">{magicWandUses}</span>
            </button>

            <button
              onClick={() => {
                if (bombUses > 0 && !engine.bombMode) {
                  engine.setBombMode(true);
                  setBombUses(prev => prev - 1);
                }
              }}
              disabled={bombUses <= 0}
              className={`flex flex-col items-center justify-center p-2 w-14 h-14 rounded-xl border-2 shadow-[0_3px_0_#8B6F5C] transition-all ${
                engine.bombMode ? 'bg-[#E89B7B] animate-pulse' : bombUses > 0 ? 'bg-[#F4D58D] hover:bg-[#F7B267]' : 'bg-gray-300 opacity-50'
              }`}
            >
              <span className="text-xl">💣</span>
              <span className="text-[10px] font-black">{engine.bombMode ? '!' : bombUses}</span>
            </button>
          </div>

          {/* Bottom Row: Grid Toggle & Suggestion */}
          <div className="w-full flex items-center justify-between px-1">
            {/* Grid Toggle */}
            <div className="flex items-center p-1 bg-[#EADFC9] rounded-2xl border-2 border-[#8B6F5C] shadow-[0_2px_0_#8B6F5C]">
              <button
                onClick={() => setGridType('square')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  gridType === 'square'
                    ? 'bg-[#FFFDF9] text-[#1A2A3A] shadow-[0_2px_0_#8B6F5C]'
                    : 'text-[#8B6F5C] hover:text-[#1A2A3A]'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Square</span>
              </button>
              <button
                onClick={() => setGridType('hex')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  gridType === 'hex'
                    ? 'bg-[#FFFDF9] text-[#1A2A3A] shadow-[0_2px_0_#8B6F5C]'
                    : 'text-[#8B6F5C] hover:text-[#1A2A3A]'
                }`}
              >
                <Hexagon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hex</span>
              </button>
            </div>

            {/* Suggestions */}
            <div className="flex flex-col items-end">
              {showSuggestions && engine.suggestions.length > 0 ? (
                <div className="flex items-center gap-1 text-xs font-bold text-[#D97706] bg-[#F4D58D]/30 px-2 py-1 rounded-lg border border-[#F4D58D]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{engine.suggestions.join(' · ')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#8B6F5C]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{engine.availableWordsCount} words possible</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Victory modal */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 bg-[#2C3E50]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border-4 border-[#8B6F5C] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_12px_32px_rgba(44,62,80,0.3)] animate-modal-enter">
            <div className="w-16 h-16 rounded-2xl bg-[#A8D5BA] border-2 border-[#0F4A2B] shadow-[0_4px_0_#0F4A2B] mx-auto flex items-center justify-center text-3xl mb-4">
              🏆
            </div>
            <h2 className="text-2xl font-black text-[#1A2A3A] mb-1">VICTORY!</h2>
            <p className="text-sm text-[#8B6F5C] font-medium mb-6">
              Password unlocked. Level {levelDef?.id ?? ''} complete.
            </p>

            <div className="bg-[#F5EFE6] rounded-2xl border-2 border-[#8B6F5C]/30 p-4 mb-6">
              <span className="text-xs uppercase tracking-wider text-[#8B6F5C] font-semibold block">
                Final Score
              </span>
              <span className="text-3xl font-black tabular-nums text-[#D97706]">
                {victoryScore}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onExit}
                className="flex-1 py-3 bg-[#EADFC9] hover:bg-[#F4D58D] border-2 border-[#8B6F5C] rounded-2xl shadow-[0_4px_0_#8B6F5C] active:translate-y-1 active:shadow-none text-sm font-extrabold text-[#1A2A3A] transition-all"
              >
                Menu
              </button>
              <button
                onClick={() => {
                  setShowVictoryModal(false);
                  engine.handleRestart();
                }}
                className="flex-1 py-3 bg-[#F4D58D] hover:bg-[#F7B267] border-2 border-[#8B6F5C] rounded-2xl shadow-[0_4px_0_#8B6F5C] active:translate-y-1 active:shadow-none text-sm font-extrabold text-[#1A2A3A] transition-all"
              >
                Replay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Defeat modal */}
      {engine.gameOver && !showVictoryModal && (
        <div className="fixed inset-0 z-50 bg-[#2C3E50]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border-4 border-[#8B6F5C] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_12px_32px_rgba(44,62,80,0.3)] animate-modal-enter">
            <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] border-2 border-[#DC2626] shadow-[0_4px_0_#DC2626] mx-auto flex items-center justify-center text-3xl mb-4">
              ⏱️
            </div>
            <h2 className="text-2xl font-black text-[#1A2A3A] mb-1">TIME UP!</h2>
            <p className="text-sm text-[#8B6F5C] font-medium mb-6">
              Better luck next time.
            </p>

            <div className="flex gap-2">
              <button
                onClick={onExit}
                className="flex-1 py-3 bg-[#EADFC9] hover:bg-[#F4D58D] border-2 border-[#8B6F5C] rounded-2xl shadow-[0_4px_0_#8B6F5C] active:translate-y-1 active:shadow-none text-sm font-extrabold text-[#1A2A3A] transition-all"
              >
                Menu
              </button>
              <button
                onClick={engine.handleRestart}
                className="flex-1 py-3 bg-[#F4D58D] hover:bg-[#F7B267] border-2 border-[#8B6F5C] rounded-2xl shadow-[0_4px_0_#8B6F5C] active:translate-y-1 active:shadow-none text-sm font-extrabold text-[#1A2A3A] transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}