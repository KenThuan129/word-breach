import React from 'react';
import { GAME_TRIE } from '../game/dictionary';
import { CONFIG } from '../game/config';

interface WordPreviewBarProps {
  currentWord: string;
  combo: number;
}

export function WordPreviewBar({ currentWord, combo }: WordPreviewBarProps) {
  const isWordValid = currentWord.length >= CONFIG.minWordLength && GAME_TRIE.has(currentWord);

  return (
    <div className="w-full max-w-xl min-h-[52px] bg-[#FFFDF9] border-2 border-[#8B6F5C] rounded-2xl shadow-[0_3px_0_#8B6F5C] px-4 py-2 flex items-center justify-between gap-2 z-10">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-xl sm:text-2xl font-black tracking-wider text-[#1A2A3A] uppercase truncate">
          {currentWord || <span className="text-[#8B6F5C]/40 tracking-normal text-base font-normal">Drag to spell words...</span>}
        </span>
      </div>

      {currentWord.length > 0 && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#8B6F5C] bg-[#F5EFE6] px-2 py-0.5 rounded-lg border border-[#8B6F5C]/30">
            {currentWord.length} letters
          </span>
          {isWordValid ? (
            <span className="text-xs font-bold text-[#059669] bg-[#A8D5BA]/40 px-2 py-0.5 rounded-lg border border-[#A8D5BA]">
              Valid!
            </span>
          ) : (
            <span className="text-xs font-medium text-[#8B6F5C]/80">
              {currentWord.length < CONFIG.minWordLength ? 'Min 3 letters' : 'Invalid'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}