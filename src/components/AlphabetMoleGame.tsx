import React, { useState, useEffect, useRef } from 'react';

interface AlphabetMoleGameProps {
  onScore?: (score: number) => void;
}

interface MoleData {
  id: number;
  letter: string;
  x: number; // % position
  y: number; // % position
  active: boolean;
  isHit: boolean;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Helper: Tính khoảng cách giữa 2 điểm (theo %)
function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function AlphabetMoleGame({ onScore }: AlphabetMoleGameProps) {
  // Index of the current letter (0 = A, 25 = Z)
  const [currentIdx, setCurrentIdx] = useState(0); 
  // Could be 1 or 2 letters
  const [targets, setTargets] = useState<string[]>([ALPHABET[0]]); 
  const [moles, setMoles] = useState<MoleData[]>([]);
  const [score, setScore] = useState(0);
  const [hitTexts, setHitTexts] = useState<{ id: number; x: number; y: number }[]>([]);
  
  const nextIdRef = useRef(0);
  
  // Độ khó: Từ 0 (dễ) đến 1 (khó)
  const difficulty = currentIdx / (ALPHABET.length - 1); 
  
  // Tốc độ: Spawn nhanh hơn, tồn tại ngắn hơn khi độ khó tăng
  const spawnIntervalMs = Math.max(250, 800 - difficulty * 500);
  const despawnChance = 0.05 + difficulty * 0.15; // Xác suất biến mất mỗi tick (500ms)

  // 1. Khởi tạo Target mới khi qua màn
  // 1. Khởi tạo Target mới khi qua màn
  useEffect(() => {
    // Nếu đã qua vòng 1 (currentIdx = 0 khi mới bắt đầu, hoặc vừa reset vòng)
    // Hoặc ta có thể dựa vào biến đếm số câu đã trả lời đúng.
    // Để đơn giản, ta dùng currentIdx làm mốc. Nhưng vì vòng 2 nó reset về 0, 
    // ta sẽ check xem người chơi đã đạt max score chưa.
    
    const isRound2 = currentIdx === 0 && score >= 26; // Giả định score lưu tổng số câu đúng

    if (isRound2) {
      // Vòng 2: Random chữ cái
      const random1 = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      // 30% cơ hội có 2 chữ
      const isDouble = Math.random() < 0.3;
      if (isDouble) {
        let random2 = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        while (random2 === random1) { // Đảm bảo 2 chữ khác nhau
          random2 = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        }
        setTargets([random1, random2]);
      } else {
        setTargets([random1]);
      }
    } else {
      // Vòng 1: Theo thứ tự bảng chữ cái
      const baseLetter = ALPHABET[currentIdx];
      const isDouble = Math.random() < 0.3 && currentIdx < 24;
      
      if (isDouble) {
        setTargets([baseLetter, ALPHABET[currentIdx + 1]]);
      } else {
        setTargets([baseLetter]);
      }
    }
  }, [currentIdx, score]); // Thêm score vào dependency

  // 2. Game Loop: Spawn Moles
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setMoles((prev) => {
        const activeMoles = prev.filter(m => m.active);
        // Giới hạn số lượng mole trên màn hình (tăng theo độ khó)
        const maxMoles = 4 + Math.floor(difficulty * 3); 
        if (activeMoles.length >= maxMoles) return prev;

        // Chọn chữ cái để spawn (ưu tiên chữ mục tiêu)
        let letter: string;
        if (Math.random() < 0.4) {
          letter = targets[Math.floor(Math.random() * targets.length)];
        } else {
          letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        }

        // Tìm vị trí không đè lên mole khác
        let attempts = 0;
        let x = 0, y = 0;
        let validPosition = false;

        while (attempts < 20 && !validPosition) {
          // x: 10% -> 90%
          // y: 35% -> 90% (chừa 30% trên cùng cho HUD)
          x = 10 + Math.random() * 80;
          y = 35 + Math.random() * 55;

          validPosition = true;
          for (const m of activeMoles) {
            // Khoảng cách tối thiểu giữa 2 tâm ô là 18% (để không đè lên nhau)
            if (distance(x, y, m.x, m.y) < 18) {
              validPosition = false;
              break;
            }
          }
          attempts++;
        }

        if (!validPosition) return prev; // Không tìm được chỗ, bỏ qua lượt spawn này

        return [...prev, {
          id: nextIdRef.current++,
          letter,
          x,
          y,
          active: true,
          isHit: false
        }];
      });
    }, spawnIntervalMs);

    return () => clearInterval(spawnInterval);
  }, [targets, difficulty, spawnIntervalMs]);

  // 3. Game Loop: Despawn (Moles chui xuống nếu không đập)
  useEffect(() => {
    const despawnInterval = setInterval(() => {
      setMoles((prev) => {
        return prev.map(m => {
          if (m.active && Math.random() < despawnChance) {
            return { ...m, active: false };
          }
          return m;
        }).filter(m => m.active || m.isHit);
      });
      
      // Dọn dẹp các mole đã bị đập sau khi animation chạy xong
      setTimeout(() => {
        setMoles(prev => prev.filter(m => !m.isHit));
      }, 300);
      
    }, 500);
    return () => clearInterval(despawnInterval);
  }, [despawnChance]);


  // 4. Handle Click
  const handleMoleClick = (mole: MoleData) => {
    if (!mole.active || mole.isHit) return;

    if (targets.includes(mole.letter)) {
      // Đập đúng chữ mục tiêu
      setScore(s => s + 1);
      if (onScore) onScore(score + 1);
      
      // Hiện +1 text
      const textId = nextIdRef.current++;
      setHitTexts(prev => [...prev, { id: textId, x: mole.x, y: mole.y }]);
      setTimeout(() => {
        setHitTexts(prev => prev.filter(t => t.id !== textId));
      }, 800);

      // Xử lý logic chuyển màn
      if (targets.length === 2) {
        // Nếu màn có 2 chữ, đập trúng 1 chữ -> chỉ cần chữ còn lại
        const remainingTargets = targets.filter(t => t !== mole.letter);
        setTargets(remainingTargets);
      } else {
        // Màn 1 chữ -> Tiến lên chữ tiếp theo trong bảng chữ cái
        if (currentIdx < ALPHABET.length - 1) {
          setCurrentIdx(prev => prev + 1);
        } else {
          // Thắng tuyệt đối (đã đập hết Z)
          setCurrentIdx(0); 
        }
      }
    } else {
      // Đập sai (không phạt, chỉ chui xuống)
    }

    // Animation bị đập
    setMoles(prev => prev.map(m => m.id === mole.id ? { ...m, isHit: true, active: false } : m));
  };

  return (
    <div className="relative w-full max-w-lg h-[350px] bg-[#EADFC9] rounded-3xl border-4 border-[#8B6F5C] shadow-inner overflow-hidden select-none">
      
      {/* Top Bar: Target & Score (Vùng cấm spawn mole) */}
      <div className="absolute top-0 left-0 right-0 h-[15%] p-3 flex justify-between items-center z-20 pointer-events-none bg-[#EADFC9] shadow-sm">
        <div className="bg-[#FFFDF9] px-3 py-1 rounded-xl border-2 border-[#8B6F5C] shadow-[0_2px_0_#8B6F5C] flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#8B6F5C] uppercase tracking-widest">Target</span>
          <div className="flex gap-1">
            {targets.map(t => (
              <span key={t} className="text-xl font-black text-[#1A2A3A]">{t}</span>
            ))}
          </div>
        </div>
        <div className="bg-[#F4D58D] px-3 py-1 rounded-xl border-2 border-[#8B6F5C] shadow-[0_2px_0_#8B6F5C]">
          <span className="text-sm font-bold text-[#1A2A3A]">Score: {score}</span>
        </div>
      </div>

      {/* Play Area (Từ 15% trở xuống) */}
      <div className="absolute inset-0 top-[15%] px-4 pb-4">
        {moles.map((mole) => {
          if (!mole.active && !mole.isHit) return null;

          return (
            <div
              key={mole.id}
              onPointerDown={(e) => {
                e.preventDefault(); // Tránh bị dính sự kiện cuộn trang trên mobile
                handleMoleClick(mole);
              }}
              className={`absolute w-12 h-12 flex items-center justify-center font-black text-2xl rounded-xl cursor-pointer transition-all duration-200 ${
                mole.isHit 
                  ? 'scale-0 opacity-0 rotate-45' 
                  : 'scale-100 opacity-100 hover:scale-110'
              }`}
              style={{
                left: `${mole.x}%`,
                top: `${mole.y}%`,
                background: targets.includes(mole.letter)
                  ? 'linear-gradient(145deg, #FDF0D5 0%, #F4D58D 100%)' 
                  : '#FFFDF9',
                border: '2px solid #8B6F5C',
                boxShadow: '0 4px 0 #8B6F5C, 0 6px 10px rgba(0,0,0,0.15)',
                marginLeft: '-24px', // Center align
                marginTop: '-24px',
                zIndex: mole.isHit ? 10 : 1,
              }}
            >
              {mole.letter}
            </div>
          );
        })}

        {/* Floating +1 Texts */}
        {hitTexts.map((txt) => (
          <div
            key={txt.id}
            className="absolute text-2xl font-black text-[#D97706] drop-shadow-[0_2px_0_#FFF] pointer-events-none z-30"
            style={{
              left: `${txt.x}%`,
              top: `${txt.y}%`,
              animation: 'moleHitFloat 0.8s ease-out forwards',
              marginLeft: '-24px',
              marginTop: '-24px'
            }}
          >
            +1
          </div>
        ))}
      </div>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-20">
        <p className="text-[10px] text-[#8B6F5C] font-bold uppercase tracking-widest opacity-60">
          Whack the letter: {targets.join(' & ')}
        </p>
      </div>
    </div>
  );
}