import React from 'react';
import { Lock } from 'lucide-react';

interface SecretPasswordCardProps {
  target: string;
  unlockedLetters: string[]; // format "idx:letter"
  hint?: string;
}

export function SecretPasswordCard({ target, unlockedLetters, hint }: SecretPasswordCardProps) {
  if (!target) return null;

  const unlockedSet = new Set(unlockedLetters);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#FFFDF9] border-2 border-[#8B6F5C] rounded-2xl shadow-[0_3px_0_#8B6F5C] px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#D97706]" />
            <span className="text-[10px] font-bold text-[#8B6F5C] uppercase tracking-widest">
              Secret Password
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#8B6F5C]">
            {unlockedLetters.length}/{target.length}
          </span>
        </div>

        {/* Slots */}
        <div className="flex items-center justify-center gap-1.5">
          {target.split('').map((letter, idx) => {
            const isUnlocked = unlockedSet.has(`${idx}:${letter}`);
            return (
              <div
                key={idx}
                className={`w-9 h-11 sm:w-11 sm:h-13 rounded-lg border-2 flex items-center justify-center font-black text-xl sm:text-2xl transition-all duration-500 ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-[#FDF0D5] to-[#F4D58D] border-[#8B6F5C] text-[#1A2A3A] shadow-[0_3px_0_#8B6F5C] scale-100'
                    : 'bg-[#EFE7DA] border-[#8B6F5C]/40 text-[#8B6F5C]/30 shadow-none scale-95'
                }`}
                style={
                  isUnlocked
                    ? { animation: 'secretReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }
                    : undefined
                }
              >
                {isUnlocked ? letter : '?'}
              </div>
            );
          })}
        </div>

        {/* Hint */}
        {hint && (
          <div className="mt-3 pt-2.5 border-t border-[#8B6F5C]/20">
            <p className="text-xs text-center text-[#8B6F5C] italic font-medium leading-snug">
              💭 &ldquo;{hint}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}