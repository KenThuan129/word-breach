/**
 * Vocabulary Service
 * Fetch words by letter and length to ensure comprehensive coverage.
 */

const STORAGE_KEYS = {
  WORDS: 'wb_vocab_words',
  VERSION: 'wb_vocab_version',
  LAST_UPDATE: 'wb_vocab_last_update',
};

const CURRENT_VOCAB_VERSION = 2; // Tăng version để force update nếu có cache cũ
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface VocabularyState {
  words: string[];
  hasCache: boolean;
  needsUpdate: boolean;
  lastUpdate: number;
  version: number;
}

export function getLocalVocabulary(): VocabularyState {
  try {
    const rawWords = localStorage.getItem(STORAGE_KEYS.WORDS);
    const version = parseInt(localStorage.getItem(STORAGE_KEYS.VERSION) || '0', 10);
    const lastUpdate = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_UPDATE) || '0', 10);
    
    const hasCache = !!rawWords && rawWords.length > 0;
    const needsUpdate = !hasCache || version < CURRENT_VOCAB_VERSION || (Date.now() - lastUpdate > ONE_DAY_MS);
    
    return {
      words: rawWords ? JSON.parse(rawWords) : [],
      hasCache,
      needsUpdate,
      lastUpdate,
      version,
    };
  } catch (e) {
    return { words: [], hasCache: false, needsUpdate: true, lastUpdate: 0, version: 0 };
  }
}

export function saveLocalVocabulary(words: string[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VOCAB_VERSION.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
  } catch (e) {
    console.warn('Failed to save vocabulary to local storage', e);
  }
}

export interface FetchProgressCallback {
  (phase: 'init' | 'enhance', progress: number, total: number, message: string): void;
}

/**
 * Main function to load/update vocabulary.
 * Chia nhỏ request theo bảng chữ cái và độ dài để đảm bảo lấy được nhiều từ nhất.
 */
export async function initializeVocabulary(
  onProgress: FetchProgressCallback
): Promise<string[]> {
  const local = getLocalVocabulary();
  
  if (local.hasCache && !local.needsUpdate) {
    onProgress('init', 100, 100, 'Vocabulary loaded from cache.');
    return local.words;
  }

  const finalWords = new Set<string>(local.words);
  
  // Chiến lược: Fetch 8 request song song. Mỗi request lấy 1 độ dài từ khác nhau.
  // Datamuse sẽ trả về 1000 từ phổ biến nhất cho độ dài đó (bắt đầu bằng bất kỳ chữ cái nào).
  const lengths = [3, 4, 5, 6, 7, 8];
  const totalBatches = lengths.length;
  
  onProgress(
    local.hasCache ? 'enhance' : 'init',
    0,
    totalBatches,
    local.hasCache ? 'Updating dictionary...' : 'Downloading dictionary...'
  );

  let completedBatches = 0;

  for (const len of lengths) {
    const queryStr = '?'.repeat(len); // e.g., "???" cho 3 chữ cái
    try {
      // sp = spelling pattern, max=1000 là giới hạn tối đa của Datamuse
      const res = await fetch(`https://api.datamuse.com/words?sp=${queryStr}&max=1000&md=f`);
      if (res.ok) {
        const data = await res.json();
        data.forEach((item: any) => {
          const w = item.word.toUpperCase();
          // Lọc lại lần nữa cho chắc chắn (chỉ lấy chữ cái, đúng độ dài)
          if (new RegExp(`^[A-Z]{${len}}$`).test(w)) {
            finalWords.add(w);
          }
        });
      }
    } catch (e) {
      console.warn(`Fetch failed for length ${len}`, e);
    }
    
    completedBatches++;
    onProgress(
      local.hasCache ? 'enhance' : 'init',
      completedBatches,
      totalBatches,
      `Found ${finalWords.size} words...`
    );
    
    // Nghỉ 100ms giữa các request để tránh bị chặn
    await new Promise(r => setTimeout(r, 100));
  }

  const result = Array.from(finalWords);
  saveLocalVocabulary(result);
  return result;
}