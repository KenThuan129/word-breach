import React, { useState } from 'react';
import { X, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { SOUND } from '../game/sound';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [isMuted, setIsMuted] = useState(SOUND.getMuted());

  const handleResetProgress = () => {
    if (window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload(); // Reload nhanh gọn lẹ
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2C3E50]/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#FFFDF9] border-4 border-[#8B6F5C] rounded-3xl p-6 max-w-sm w-full shadow-[0_12px_32px_rgba(44,62,80,0.3)] animate-modal-enter" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[#1A2A3A]">Settings</h2>
          <button onClick={onClose} className="p-1.5 bg-[#EADFC9] rounded-xl hover:bg-[#F4D58D]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#F5EFE6] rounded-2xl border-2 border-[#8B6F5C]/30">
            <span className="font-bold text-[#1A2A3A]">Sound Effects</span>
            <button
              onClick={() => {
                const muted = SOUND.toggleMute();
                setIsMuted(muted);
              }}
              className="p-2 bg-[#FFFDF9] border-2 border-[#8B6F5C] rounded-xl shadow-[0_2px_0_#8B6F5C]"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-[#8B6F5C]" /> : <Volume2 className="w-5 h-5 text-[#1A2A3A]" />}
            </button>
          </div>

          {/* Reset Progress */}
          <button
            onClick={handleResetProgress}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#FEE2E2] hover:bg-[#FECDD3] text-[#DC2626] font-bold border-2 border-[#DC2626] rounded-2xl shadow-[0_3px_0_#DC2626] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Progress
          </button>
        </div>

      </div>
    </div>
  );
}