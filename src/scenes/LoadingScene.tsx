import React, { useEffect, useState } from 'react';
import { hasSeenLoading, markLoadingSeen } from '../game/storage';
import { initializeVocabulary, getLocalVocabulary } from '../game/vocabularyService';
import { mergeDynamicWords } from '../game/dictionary';
import { AlphabetMoleGame } from '../components/AlphabetMoleGame';

interface LoadingSceneProps {
  onComplete: () => void;
}

type LoadPhase = 'check' | 'cinematic' | 'vocab-init' | 'vocab-enhance' | 'done';

export function LoadingScene({ onComplete }: LoadingSceneProps) {
  const [isFirstVisit] = useState<boolean>(() => !hasSeenLoading());
  
  // === DEBUG: Force minigame via URL param ?debug=mole ===
  const debugMole = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('debug') === 'mole';

  const [phase, setPhase] = useState<LoadPhase>(debugMole ? 'vocab-init' : 'check');
  
  // Progress tracking (Set default nếu ở chế độ debug)
  const [vocabProgress, setVocabProgress] = useState({ 
    current: debugMole ? 30 : 0, 
    total: 100 
  });
  const [vocabMessage, setVocabMessage] = useState(
    debugMole ? 'DEBUG MODE: Minigame always active. Refresh to reload.' : ''
  );

  // Animation states (Cinematic)
  const [titleVisible, setTitleVisible] = useState<boolean>(false);
  const [subtitleVisible, setSubtitleVisible] = useState<boolean>(false);
  const [logoVisible, setLogoVisible] = useState<boolean>(!isFirstVisit);

  // 1. Check cache and initialize vocabulary
   useEffect(() => {
    let isMounted = true;

    async function init() {
      // === DEBUG: Skip all API calls if debug mode ===
      if (debugMole) {
        // Chúng ta không cần làm gì cả vì State đã được khởi tạo sẵn ở trên.
        // Chỉ cần return để bỏ qua việc gọi API.
        return; 
      }
      const local = getLocalVocabulary();
      
      // Determine if we need to fetch
      const needsFetch = !local.hasCache || local.needsUpdate;
      
      if (needsFetch) {
        setPhase(local.hasCache ? 'vocab-enhance' : 'vocab-init');
        
        await initializeVocabulary((p, current, total, msg) => {
          if (!isMounted) return;
          setVocabProgress({ current, total });
          setVocabMessage(msg);
        });
        
        // After fetch, merge into Trie
        const finalVocab = getLocalVocabulary().words;
        mergeDynamicWords(finalVocab);
      } else {
        // Already have cache, just merge quickly
        mergeDynamicWords(local.words);
      }
      
      if (!isMounted) return;
      
      // Move to cinematic phase after vocab is done
      setPhase('cinematic');
    }

    init();

    return () => { isMounted = false; };
  }, []);

  // 2. Cinematic Animation Timeline
  useEffect(() => {
    if (phase !== 'cinematic') return;

    markLoadingSeen();
    
    const t1 = setTimeout(() => setLogoVisible(true), isFirstVisit ? 1100 : 200);
    const t2 = setTimeout(() => setTitleVisible(true), isFirstVisit ? 1300 : 400);
    const t3 = setTimeout(() => setSubtitleVisible(true), isFirstVisit ? 1800 : 600);
    const tDone = setTimeout(() => {
      setPhase('done');
      setTimeout(onComplete, 200);
    }, isFirstVisit ? 2500 : 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tDone);
    };
  }, [phase, isFirstVisit, onComplete]);

  const handleSkip = () => {
    markLoadingSeen();
    onComplete();
  };

  // --- RENDER VOCAB LOADING ---
    // --- RENDER VOCAB LOADING WITH MINIGAME ---
  if (phase === 'vocab-init' || phase === 'vocab-enhance') {
    const pct = Math.min(100, (vocabProgress.current / vocabProgress.total) * 100);
    const isEnhance = phase === 'vocab-enhance';

    return (
      <div className="w-full h-full bg-paper-texture overflow-y-auto flex flex-col items-center justify-center p-4">
        
        {/* Header Area */}
        <div className="w-full max-w-lg flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl text-[#1A2A3A] mb-4"
               style={{
                 background: 'linear-gradient(145deg, #FDF0D5 0%, #F4D58D 100%)',
                 border: '3px solid #8B6F5C',
                 boxShadow: '0 6px 0 #8B6F5C, 0 10px 20px rgba(74,53,39,0.25)',
               }}>
            W
          </div>

          <h2 className="text-xl font-bold text-[#1A2A3A] mb-1">
            {isEnhance ? 'New Content Update' : 'Library Initializing'}
          </h2>
          
          {isEnhance && (
             <p className="text-sm text-[#D97706] font-bold mb-2">Est: 30s</p>
          )}

          {/* Progress Bar (compact) */}
          <div className="w-64 h-2 bg-[#EADFC9] rounded-full border border-[#8B6F5C] overflow-hidden mt-2 mb-1">
            <div 
              className="h-full bg-gradient-to-r from-[#F4D58D] to-[#E89B7B] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-[10px] text-[#8B6F5C] font-medium text-center h-4">
            {vocabMessage || 'Preparing dictionary...'}
          </p>
        </div>

        {/* Minigame Area */}
        <div className="w-full flex justify-center mb-4">
          <AlphabetMoleGame />
        </div>

        Loading in background. Play while you wait!
      </div>
    );
  }

  // --- RENDER CINEMATIC ---
  const logoLetters = ['W', 'O', 'R', 'D', 'B', 'E'];

  return (
    <div className="fixed inset-0 bg-paper-texture overflow-hidden flex items-center justify-center">
      {/* Ambient & Particles (Giữ nguyên từ cũ) */}
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(244, 213, 141, 0.6) 0%, transparent 55%)',
          animation: 'loadingAmbientPulse 4s ease-in-out infinite',
        }}
      />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {isFirstVisit && phase === 'cinematic' &&
            logoLetters.map((letter, i) => {
              const angle = (Math.PI * 2 * i) / logoLetters.length;
              const dist = 380;
              const tx = Math.cos(angle) * dist;
              const ty = Math.sin(angle) * dist;
              const rot = (Math.random() - 0.5) * 540;
              return (
                <div
                  key={letter}
                  className="absolute w-12 h-12 flex items-center justify-center rounded-xl font-black text-xl text-[#1A2A3A]"
                  style={{
                    background: '#F5EFE6',
                    border: '2px solid #D4C4A8',
                    boxShadow: '0 4px 0 #BCA892, 0 6px 10px rgba(92,70,52,0.18)',
                    ['--tx' as string]: `${tx}px`,
                    ['--ty' as string]: `${ty}px`,
                    ['--rot' as string]: `${rot}deg`,
                    animation: `loadingTileFlyIn 1s cubic-bezier(0.34, 1.4, 0.64, 1) ${i * 0.06}s both`,
                  } as React.CSSProperties}
                >
                  {letter}
                </div>
              );
            })}

          <div
            className="absolute w-24 h-24 rounded-2xl flex items-center justify-center font-black text-5xl text-[#1A2A3A]"
            style={{
              background: 'linear-gradient(145deg, #FDF0D5 0%, #F4D58D 100%)',
              border: '3px solid #8B6F5C',
              boxShadow: '0 8px 0 #8B6F5C, 0 12px 24px rgba(74,53,39,0.25)',
              opacity: logoVisible ? 1 : 0,
              transform: logoVisible ? 'scale(1)' : 'scale(0.3)',
              transition: 'opacity 0.5s cubic-bezier(0.34, 1.4, 0.64, 1), transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)',
            }}
          >
            W
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-4xl sm:text-5xl font-black tracking-tight text-[#1A2A3A] flex gap-0.5"
            style={{ opacity: titleVisible ? 1 : 0, transition: 'opacity 0.4s' }}
          >
            {'WORD BREACH'.split('').map((ch, i) => (
              <span key={i} style={{
                  display: 'inline-block',
                  transform: titleVisible ? 'translateY(0)' : 'translateY(20px)',
                  opacity: titleVisible ? 1 : 0,
                  transition: `transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) ${i * 0.04}s, opacity 0.4s ${i * 0.04}s`,
                }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </h1>
          <p className="text-sm sm:text-base text-[#8B6F5C] font-medium"
            style={{ opacity: subtitleVisible ? 1 : 0, transition: 'opacity 0.4s' }}
          >
            Cozy Indie Word Puzzle
          </p>
        </div>
      </div>

      {phase === 'cinematic' && isFirstVisit && (
        <button onClick={handleSkip} className="absolute bottom-6 right-6 text-xs font-bold text-[#8B6F5C] hover:text-[#1A2A3A] px-3 py-1.5 rounded-lg hover:bg-[#8B6F5C]/10 transition-all">
          Skip →
        </button>
      )}
    </div>
  );
}