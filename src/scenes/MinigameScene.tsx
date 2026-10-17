import React, { useState } from 'react';
import { ArrowLeft, Trophy, RefreshCw } from 'lucide-react';
import { AlphabetMoleGame } from '../components/AlphabetMoleGame';

interface MinigameSceneProps {
  onBack: () => void;
}

export function MinigameScene({ onBack }: MinigameSceneProps) {
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('wb_mole_highscore') || '0', 10);
  });
  const [currentScore, setCurrentScore] = useState(0);
  const [gameKey, setGameKey] = useState(Date.now()); // Dùng để reset game

  const handleScore = (newScore: number) => {
    setCurrentScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('wb_mole_highscore', newScore.toString());
    }
  };

  const handleRestart = () => {
    setCurrentScore(0);
    setGameKey(Date.now()); // Force re-mount component
  };

  return (
    <div className="w-full h-full bg-paper-texture overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-6">
      
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFDF9] border-2 border-[#8B6F5C] rounded-xl shadow-[0_2px_0_#8B6F5C] hover:bg-[#F4D58D] active:translate-y-0.5 active:shadow-[0_1px_0_#8B6F5C] transition-colors text-xs font-bold text-[#1A2A3A]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-[#8B6F5C] uppercase tracking-widest">
            Minigame
          </span>
          <h2 className="text-2xl font-black text-[#1A2A3A] leading-none" style={{ letterSpacing: '-0.03em' }}>
            WORD HOPPERS
          </h2>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative w-full max-w-lg">
        <AlphabetMoleGame key={gameKey} onScore={handleScore} />
      </div>

      {/* Footer Stats & Controls */}
      <div className="w-full max-w-lg flex items-center justify-between mt-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFDF9] border-2 border-[#8B6F5C] rounded-xl shadow-[0_2px_0_#8B6F5C]">
            <Trophy className="w-4 h-4 text-[#D97706]" />
            <span className="text-sm font-bold text-[#1A2A3A]">Best: {highScore}</span>
          </div>
        </div>

        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#EADFC9] border-2 border-[#8B6F5C] rounded-xl shadow-[0_2px_0_#8B6F5C] hover:bg-[#F4D58D] active:translate-y-0.5 active:shadow-[0_1px_0_#8B6F5C] transition-colors text-xs font-bold text-[#1A2A3A]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>
      
      <p className="text-xs text-[#8B6F5C]/60 font-medium text-center mt-6 max-w-sm">
        Whack the target letters!!
      </p>

    </div>
  );
}