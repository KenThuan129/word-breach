import { Trie } from './dictionary';
import { GridType, Position, TileData } from './types';
import { LETTER_POINTS } from './config';

export type DifficultyPhase = 1 | 2 | 3 | 4;

export interface PhaseConfig {
  phase: DifficultyPhase;
  name: string;
  icon: string;
  badgeColor: string;
  timeRangeSec: [number, number];
  wordsRange: [number, number];
  minAvailableWords: number;
  autoShuffleThreshold: number;
  comboWindowMs: number;
  rareLetterRate: number;      // 0%, 2%, 5%, 8%
  vowelRate: number;           // 10%, 15%, 20%, 25%
  commonConsonantRate: number; // 90%, 85%, 80%, 75%
  description: string;
}

export const PHASE_CONFIGS: Record<DifficultyPhase, PhaseConfig> = {
  1: {
    phase: 1,
    name: 'Warm-up',
    icon: '🌱',
    badgeColor: '#10B981', // Emerald green
    timeRangeSec: [0, 60],
    wordsRange: [0, 10],
    minAvailableWords: 5,
    autoShuffleThreshold: 3, // Auto shuffle if available < 3
    comboWindowMs: 7000,     // 7 seconds
    rareLetterRate: 0.0,     // NO rare letters (J, Q, X, Z)
    vowelRate: 0.10,
    commonConsonantRate: 0.90,
    description: 'Familiar 3-4 letter words, wide 7s combo window',
  },
  2: {
    phase: 2,
    name: 'Familiarize',
    icon: '🌿',
    badgeColor: '#3B82F6', // Blue
    timeRangeSec: [60, 180],
    wordsRange: [10, 30],
    minAvailableWords: 4,
    autoShuffleThreshold: 2, // Auto shuffle if available < 2
    comboWindowMs: 6000,     // 6 seconds
    rareLetterRate: 0.02,    // ~2% rare letters
    vowelRate: 0.15,
    commonConsonantRate: 0.85,
    description: 'Wider vocabulary (3-5 letters), subtle variety',
  },
  3: {
    phase: 3,
    name: 'Challenge',
    icon: '🌳',
    badgeColor: '#F59E0B', // Amber
    timeRangeSec: [180, 360],
    wordsRange: [30, 60],
    minAvailableWords: 3,
    autoShuffleThreshold: 2, // Auto shuffle if available < 2
    comboWindowMs: 5000,     // 5 seconds
    rareLetterRate: 0.05,    // ~5% rare letters
    vowelRate: 0.20,
    commonConsonantRate: 0.80,
    description: 'Longer words (3-6 letters), tighter 5s combo',
  },
  4: {
    phase: 4,
    name: 'Mastery',
    icon: '🔥',
    badgeColor: '#EF4444', // Red
    timeRangeSec: [360, Infinity],
    wordsRange: [60, Infinity],
    minAvailableWords: 2,
    autoShuffleThreshold: 1, // Auto shuffle on deadlock (< 1)
    comboWindowMs: 4000,     // 4 seconds
    rareLetterRate: 0.08,    // ~8% rare letters
    vowelRate: 0.25,
    commonConsonantRate: 0.75,
    description: 'Full dictionary, high speed, rare letters',
  },
};

// ==========================================
// TIER 1: ~220 Ultra-Common English Words (3-4 letters)
// Everyday vocabulary that beginners instantly recognize
// ==========================================
export const TIER1_WORDS: string[] = [
  // 3-letter ultra common
  "ACT", "AIR", "ALL", "AND", "ANT", "ANY", "ARM", "ART", "ASK", "ATE", "BAD", "BAG",
  "BAR", "BAT", "BED", "BEE", "BIG", "BIT", "BOX", "BOY", "BUS", "BUT", "BUY", "BYE",
  "CAN", "CAP", "CAR", "CAT", "COW", "CRY", "CUP", "CUT", "DAD", "DAY", "DIG", "DOG",
  "DOT", "DRY", "DUE", "EAR", "EAT", "EGG", "END", "EYE", "FAN", "FAR", "FAT", "FEW",
  "FIT", "FLY", "FOG", "FOR", "FOX", "FUN", "FUR", "GAS", "GET", "GOD", "GOT", "GUY",
  "HAD", "HAT", "HEN", "HER", "HEY", "HIM", "HIS", "HIT", "HOP", "HOT", "HOW", "HUG",
  "HUT", "ICE", "INK", "JAR", "JAW", "JET", "JOB", "JOG", "JOY", "KEY", "KID", "KIT",
  "LAB", "LAP", "LAW", "LAY", "LEG", "LET", "LID", "LIP", "LIT", "LOG", "LOT", "LOW",
  "MAD", "MAN", "MAP", "MAY", "MEN", "MET", "MOM", "MUD", "NET", "NEW", "NOD", "NOT",
  "NOW", "NUT", "OAK", "OFF", "OIL", "OLD", "ONE", "OUR", "OUT", "OWL", "OWN", "PAN",
  "PAY", "PEA", "PEN", "PET", "PIE", "PIG", "PIN", "PIT", "POP", "POT", "PUB", "PUP",
  "RAG", "RAN", "RAT", "RAW", "RAY", "RED", "RIB", "ROD", "ROW", "RUB", "RUG", "RUN",
  "SAD", "SAT", "SAW", "SAY", "SEA", "SET", "SHE", "SHY", "SIP", "SIR", "SIT", "SIX",
  "SKY", "SON", "SPY", "SUB", "SUN", "TEA", "TEN", "THE", "TIE", "TIN", "TIP", "TOE",
  "TOP", "TOW", "TOY", "TUB", "TWO", "USE", "VAN", "WAR", "WAS", "WAY", "WEB", "WET",
  "WHO", "WHY", "WIG", "WIN", "YES", "YET", "ZOO",

  // 4-letter ultra common
  "BABY", "BACK", "BAKE", "BALL", "BAND", "BANK", "BARK", "BARN", "BASE", "BATH", "BEAM",
  "BEAN", "BEAR", "BEAT", "BEEF", "BELL", "BELT", "BEND", "BEST", "BIRD", "BITE", "BLOW",
  "BLUE", "BOAT", "BODY", "BONE", "BOOK", "BOOM", "BOOT", "BOWL", "BURN", "BUSY", "CAKE",
  "CALL", "CALM", "CAMP", "CARD", "CARE", "CART", "CASE", "CASH", "CAST", "CAVE", "CHEF",
  "CITY", "CLAP", "CLAW", "CLAY", "COAL", "COAT", "COIN", "COLD", "COOK", "COOL", "CORN",
  "COST", "CRAB", "CROW", "CUBE", "CUTE", "DARK", "DATE", "DAWN", "DAYS", "DEAD", "DEAR",
  "DECK", "DEER", "DESK", "DIRT", "DISH", "DOOR", "DOVE", "DOWN", "DRAW", "DROP", "DRUM",
  "DUCK", "DUST", "EASY", "EDGE", "EGGS", "EYES", "FACE", "FAIR", "FALL", "FARM", "FAST",
  "FEAR", "FEED", "FEEL", "FEET", "FILM", "FIND", "FINE", "FIRE", "FISH", "FLAG", "FLAT",
  "FLOW", "FOOD", "FOOT", "FORK", "FREE", "FROG", "FROM", "FULL", "GAME", "GATE", "GIFT",
  "GIRL", "GIVE", "GLAD", "GLOW", "GOAL", "GOAT", "GOLD", "GOOD", "GRAB", "GROW", "HAIR",
  "HALF", "HAND", "HARD", "HARM", "HATE", "HAVE", "HEAD", "HEAR", "HEAT", "HELD", "HELP",
  "HERO", "HIDE", "HIGH", "HILL", "HINT", "HOLD", "HOLE", "HOME", "HOOK", "HOPE", "HORN",
  "HOUR", "HUNT", "HURT", "IDEA", "INCH", "IRON", "ITEM", "JOIN", "JOKE", "JUMP", "KEEP",
  "KICK", "KIND", "KING", "KISS", "KITE", "KNEE", "KNOW", "LADY", "LAKE", "LAMP", "LAND",
  "LANE", "LAST", "LATE", "LAZY", "LEAD", "LEAF", "LEAP", "LEFT", "LIFE", "LIFT", "LIKE",
  "LIME", "LINE", "LION", "LIPS", "LIST", "LIVE", "LOAD", "LOCK", "LONG", "LOOK", "LOSE",
  "LOUD", "LOVE", "LUCK", "MADE", "MAIL", "MAIN", "MAKE", "MANY", "MARK", "MEAL", "MEAT",
  "MEET", "MELT", "MILK", "MIND", "MINE", "MINT", "MOON", "MORE", "MOST", "MOVE", "MUCH",
  "MUST", "NAIL", "NAME", "NEAR", "NEAT", "NECK", "NEED", "NEST", "NEWS", "NEXT", "NICE",
  "NINE", "NOON", "NOSE", "NOTE", "NUTS", "ONCE", "OPEN", "PACK", "PAGE", "PAIN", "PAIR",
  "PARK", "PART", "PASS", "PAST", "PATH", "PEAK", "PEAR", "PICK", "PILE", "PINK", "PIPE",
  "PLAN", "PLAY", "PLOT", "POEM", "POET", "POLE", "POND", "POOL", "POOR", "POST", "PULL",
  "PURE", "PUSH", "RACE", "RAIN", "READ", "REAL", "REST", "RICE", "RICH", "RIDE", "RING",
  "RISE", "RISK", "ROAD", "ROAR", "ROCK", "ROOF", "ROOM", "ROOT", "ROPE", "ROSE", "RULE",
  "RUSH", "SAFE", "SAIL", "SALT", "SAME", "SAND", "SAVE", "SEAT", "SEED", "SEEK", "SEEN",
  "SELL", "SEND", "SHIP", "SHOE", "SHOP", "SHOT", "SHOW", "SHUT", "SICK", "SIDE", "SIGN",
  "SILK", "SING", "SINK", "SITE", "SIZE", "SKIN", "SKIP", "SLOW", "SNOW", "SOAP", "SOIL",
  "SOME", "SONG", "SOON", "SOUP", "SPOT", "STAR", "STAY", "STEP", "STOP", "SWIM", "TAIL",
  "TAKE", "TALE", "TALK", "TALL", "TANK", "TASK", "TEAM", "TEAR", "TELL", "TENT", "TEST",
  "TEXT", "THEN", "THIN", "THIS", "TIDE", "TIME", "TINY", "TOLL", "TONE", "TOOK", "TOOL",
  "TOWN", "TOYS", "TRAP", "TREE", "TRIP", "TRUE", "TUBE", "TUNE", "TURN", "TYPE", "UNIT",
  "UPON", "USER", "VAST", "VIEW", "VINE", "WAIT", "WAKE", "WALK", "WALL", "WANT", "WARM",
  "WARN", "WASH", "WAVE", "WAYS", "WEAK", "WEAR", "WEEK", "WELL", "WENT", "WEST", "WIDE",
  "WILD", "WILL", "WIND", "WING", "WINK", "WIRE", "WISH", "WITH", "WOLF", "WOOD", "WOOL",
  "WORD", "WORK", "WORM", "YARD", "YEAR", "ZONE"
];

// ==========================================
// TIER 2: Common Words (~500 words total: Tier 1 + ~300 common 3-5 letters)
// ==========================================
export const TIER2_ADDITIONAL_WORDS: string[] = [
  "HOUSE", "HAPPY", "MUSIC", "PHONE", "WATER", "LIGHT", "HEART", "SMILE", "DREAM",
  "PEACE", "MAGIC", "QUEEN", "WORLD", "PLANT", "BEACH", "CLOUD", "RIVER", "BREAD",
  "APPLE", "GLASS", "CHAIR", "TABLE", "CLOCK", "TRAIN", "HORSE", "SHEEP", "GRASS",
  "EARTH", "SPACE", "NIGHT", "LAUGH", "STAND", "WRITE", "LEARN", "BUILD", "CARRY",
  "CATCH", "CLEAN", "COVER", "DANCE", "DRINK", "DRIVE", "ENJOY", "FIGHT", "GUESS",
  "KNOCK", "LEAVE", "MARRY", "PAINT", "POINT", "REACH", "RELAX", "SERVE", "SHINE",
  "SHOOT", "SHOUT", "SLEEP", "SMELL", "SPEAK", "SPEND", "START", "SWEET", "BRAVE",
  "CLEAR", "FRESH", "GREAT", "HEAVY", "LUCKY", "PROUD", "QUICK", "QUIET", "SHARP",
  "SHORT", "SMART", "STRONG", "YOUNG", "BLOOM", "BRUSH", "CANDY", "CHARM", "CHEST",
  "CROWN", "EAGLE", "FAIRY", "FLAME", "FLASH", "FROST", "GIANT", "GRACE", "GROVE",
  "JEWEL", "LEMON", "MANGO", "MEDAL", "NORTH", "OCEAN", "PEARL", "PIANO", "PILOT",
  "PIZZA", "PRISM", "RADIO", "RIDER", "ROBOT", "SAILOR", "SCENE", "SHADOW", "SHIRT",
  "SIGHT", "SKATE", "SKILL", "SLATE", "SNAKE", "SOLAR", "SOLID", "SOUND", "SPARK",
  "SPEAR", "SPEED", "SPELL", "SPICE", "SPOON", "SPORT", "STAGE", "STAMP", "STEAL",
  "STEAM", "STEEL", "STORM", "STORY", "STRIP", "SUGAR", "SWIFT", "SWORD", "TIGER",
  "TOOTH", "TOWER", "TRACK", "TRAIL", "TREAT", "TRIBE", "TRUCK", "VALVE", "VAPOR",
  "VOICE", "WAGON", "WHEAT", "WHEEL", "WHITE", "WINTER", "YOUTH", "ZEBRA",
  "ALBUM", "ALIEN", "ANGEL", "ARROW", "ASSET", "BADGE", "BASIN", "BEAST", "BLAZE",
  "BLEND", "BLINK", "BLOCK", "BOARD", "BOUND", "BRICK", "BRIEF", "BROAD", "CABIN",
  "CAMEL", "CANAL", "CARGO", "CEDAR", "CHAIN", "CHALK", "CHAMP", "CLIFF", "CLOTH",
  "COAST", "CORAL", "CRANE", "CREEK", "CREST", "CRISP", "DELTA", "DIVER", "DRAIN",
  "DRIFT", "EMBER", "EXACT", "EXTRA", "FEAST", "FIBER", "FIELD", "FLUTE", "FORGE",
  "FRAME", "FRONT", "FRUIT", "GLOVE", "GRAIN", "GRAND", "GRAPE", "GRAVE", "GUEST",
  "GUIDE", "HABIT", "HONEY", "HOTEL", "HUMAN", "IMAGE", "INBOX", "INDEX", "INPUT",
  "IVORY", "JUDGE", "JUICE", "KNEEL", "KNIFE", "LATCH", "LEMON", "LINEN", "LIVER",
  "LODGE", "LOGIC", "LUNAR", "MANOR", "MAPLE", "MARCH", "MATCH", "MAYOR", "MELON",
  "MERCY", "METAL", "MINER", "MODEL", "MOTOR", "MOUNT", "MOUSE", "NOBLE", "OASIS",
  "OLIVE", "ONION", "OPERA", "ORBIT", "ORGAN", "OTTER", "PANEL", "PANIC", "PATCH",
  "PAUSE", "PERCH", "PETAL", "PITCH", "PLAIN", "PLAZA", "PLUME", "POUND", "POWER",
  "PRESS", "PRICE", "PRIDE", "PRIME", "PRIZE", "PULSE", "PUPIL", "QUILT", "RADAR",
  "RANCH", "RANGE", "RAPID", "RAZOR", "RIDGE", "RIVAL", "ROAST", "ROBIN", "ROGER",
  "ROUND", "ROYAL", "RULER", "RUMOR", "SALAD", "SAUCE", "SCALE", "SCARF", "SCENT",
  "SCOUT", "SHARK", "SHORE", "SKIRT", "SLOPE", "SMOKE", "SOLVE", "SPARK", "SPHERE"
];

export const TIER2_WORDS: string[] = Array.from(new Set([...TIER1_WORDS, ...TIER2_ADDITIONAL_WORDS]));

// ==========================================
// TIER 3: Moderate (~1500 words total: Tier 2 + ~1000 4-6 letters)
// ==========================================
export const TIER3_ADDITIONAL_WORDS: string[] = [
  "PUZZLE", "RHYTHM", "JOURNEY", "BALANCE", "BRIDGE", "CASTLE", "FLOWER", "FOREST",
  "GARDEN", "ISLAND", "NATURE", "PLANET", "SILVER", "SPRING", "SUMMER", "WINTER",
  "AUTUMN", "BREEZE", "BUBBLE", "BUTTON", "CANDLE", "CANYON", "CARPET", "CHANCE",
  "CHANGE", "CHERRY", "CIRCLE", "CLOVER", "COFFEE", "COPPER", "CORNER", "DAMAGE",
  "DANCER", "DANGER", "DEGREE", "DESERT", "DESIGN", "DESIRE", "DETAIL", "DINNER",
  "DOCTOR", "DOLPHIN", "DRAGON", "DRAWER", "ENGINE", "ESCAPE", "ESTATE", "FABRIC",
  "FACTOR", "FALCON", "FAMOUS", "FATHER", "FEATHER", "FELLOW", "FILTER", "FINISH",
  "FLAVOR", "FLIGHT", "FREEZE", "FRIEND", "FROZEN", "GALAXY", "GATHER", "GENTLE",
  "GIFTED", "GINGER", "GLANCE", "GOLDEN", "GROUND", "GUITAR", "HAMMER", "HARBOR",
  "HARVEST", "HEAVEN", "HEIGHT", "HERBAL", "HEROIC", "HOLLOW", "HONEST", "HUNTER",
  "IMPACT", "INFANT", "INSECT", "JACKET", "JUNGLE", "KEEPER", "KITTEN", "KNIGHT",
  "LADDER", "LAGOON", "LANTERN", "LEGEND", "LETTER", "LIGHTS", "LIZARD", "LOCKET",
  "MAGNET", "MANSION", "MARKET", "MEADOW", "MEMBER", "MEMORY", "MIRROR", "MOMENT",
  "MONKEY", "MUSEUM", "MYSTIC", "NEEDLE", "NOTICE", "NUMBER", "OFFICE", "ORANGE",
  "ORCHID", "PALACE", "PANTHER", "PARADE", "PARCEL", "PARROT", "PASTEL", "PATHWAY",
  "PATIENT", "PEBBLE", "PEPPER", "PICNIC", "PIGEON", "PILLOW", "PLASTIC", "POCKET",
  "POTATO", "POWDER", "PRAISE", "PRAYER", "PRETTY", "PRINCE", "PRISON", "RABBIT",
  "REASON", "RECIPE", "RECORD", "RELIEF", "REMIND", "REPAIR", "RESCUE", "RESORT",
  "RETURN", "REWARD", "RIBBON", "ROCKET", "SALMON", "SAMPLE", "SCHOOL", "SEASON",
  "SECRET", "SERENE", "SIMPLE", "SKETCH", "SMOOTH", "SOCCER", "SOCKET", "SPEECH",
  "SPIRIT", "SPLASH", "SQUARE", "STABLE", "STATUE", "STREAM", "STREET", "STRING",
  "SUNSET", "TARGET", "TEMPLE", "THIRST", "TIMBER", "TRAVEL", "TUNNEL", "VALLEY",
  "VELVET", "VESSEL", "VIOLIN", "VOYAGE", "WALLET", "WALNUT", "WANDER", "WEALTH",
  "WILLOW", "WINDOW", "WIZARD", "WOODEN", "WRITER", "YELLOW", "ZEPHYR"
];

// ==========================================
// Pre-built Tries for each Phase
// ==========================================
export const PHASE_TRIES: Record<DifficultyPhase, Trie> = (() => {
  const t1 = new Trie();
  for (const w of TIER1_WORDS) t1.insert(w);

  const t2 = new Trie();
  for (const w of TIER2_WORDS) t2.insert(w);

  const t3 = new Trie();
  // Insert Tier 2 + Tier 3 additional
  for (const w of TIER2_WORDS) t3.insert(w);
  for (const w of TIER3_ADDITIONAL_WORDS) t3.insert(w);

  // We assign t4 at runtime or import GAME_TRIE
  return {
    1: t1,
    2: t2,
    3: t3,
    4: t3, // Will be set to GAME_TRIE in initialization
  };
})();

export function setMasterTrieForPhase4(masterTrie: Trie) {
  PHASE_TRIES[4] = masterTrie;
}

// ==========================================
// LETTER SPAWNING & BOARD BALANCER
// ==========================================
export const VOWELS = ['E', 'A', 'I', 'O', 'U'];
export const VOWEL_WEIGHTS: Record<string, number> = { E: 13, A: 10, I: 9, O: 8, U: 5 };

export const COMMON_CONSONANTS = ['R', 'S', 'T', 'L', 'N', 'D'];
export const COMMON_CONSONANT_WEIGHTS: Record<string, number> = { T: 8, N: 7, R: 7, S: 7, L: 6, D: 4 };

export const SECONDARY_CONSONANTS = ['B', 'C', 'F', 'G', 'H', 'K', 'M', 'P', 'V', 'W', 'Y'];
export const SECONDARY_WEIGHTS: Record<string, number> = { C: 5, P: 4, M: 4, H: 4, G: 3, B: 3, F: 2, Y: 3, W: 2, K: 2, V: 2 };

export const RARE_LETTERS = ['J', 'Q', 'X', 'Z'];

// Letters considered very common for the minimum 5-tile guarantee: (R, S, T, L, N, E, A)
export const CORE_COMMON_LETTERS = new Set(['R', 'S', 'T', 'L', 'N', 'E', 'A']);
export const VOWEL_SET = new Set(['A', 'E', 'I', 'O', 'U']);

function pickWeighted(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [letter, w] of entries) {
    if (r < w) return letter;
    r -= w;
  }
  return entries[0][0];
}

/**
 * Spawns a letter dynamically adhering to Phase difficulty,
 * while enforcing the mandatory balance rules:
 * - At least 30% vowels on board
 * - At least 5 core common letters (R, S, T, L, N, E, A) on board
 */
export function getPhaseLetter(
  phase: DifficultyPhase,
  boardGrid: (TileData | null)[][],
  rareBonus: number = 0
): string {
  const config = PHASE_CONFIGS[phase];

  // 1. Count current vowels, common letters, and total non-null tiles
  let vowelCount = 0;
  let commonCount = 0;
  let totalTiles = 0;

  for (let r = 0; r < boardGrid.length; r++) {
    for (let c = 0; c < boardGrid[r].length; c++) {
      const tile = boardGrid[r][c];
      if (tile && !tile.clearing) {
        totalTiles++;
        if (VOWEL_SET.has(tile.letter)) vowelCount++;
        if (CORE_COMMON_LETTERS.has(tile.letter)) commonCount++;
      }
    }
  }

  // 2. Rule 4.2: Board must maintain at least 30% vowels
  if (totalTiles > 0 && vowelCount / totalTiles < 0.30) {
    return pickWeighted(VOWEL_WEIGHTS);
  }

  // 3. Rule 4.2: Board must have at least 5 tiles of common letters (R, S, T, L, N, E, A)
  if (commonCount < 5) {
    const combinedWeights: Record<string, number> = {
      ...COMMON_CONSONANT_WEIGHTS,
      E: 13,
      A: 10,
    };
    return pickWeighted(combinedWeights);
  }

  // 4. Rare letter check (Phase 1 = 0%, Phase 2 = 2%, Phase 3 = 5%, Phase 4 = 8% + DDA)
  const effectiveRareRate = Math.max(0, Math.min(0.20, config.rareLetterRate + rareBonus));
  if (effectiveRareRate > 0 && Math.random() < effectiveRareRate) {
    return RARE_LETTERS[Math.floor(Math.random() * RARE_LETTERS.length)];
  }

  // 5. Roll Vowel vs Consonant
  if (Math.random() < config.vowelRate) {
    return pickWeighted(VOWEL_WEIGHTS);
  }

  // 6. Roll Consonants: In Phase 1, 95% common consonants (R, S, T, L, N, D)
  if (phase === 1) {
    return Math.random() < 0.95
      ? pickWeighted(COMMON_CONSONANT_WEIGHTS)
      : pickWeighted(SECONDARY_WEIGHTS);
  }

  if (Math.random() < config.commonConsonantRate) {
    return pickWeighted(COMMON_CONSONANT_WEIGHTS);
  }

  return pickWeighted(SECONDARY_WEIGHTS);
}

// ==========================================
// DDA & PHASE TRANSITION LOGIC
// ==========================================
export interface ClearedWordRecord {
  timestamp: number; // Date.now()
  word: string;
  length: number;
}

export interface DDAState {
  basePhase: DifficultyPhase;
  effectivePhase: DifficultyPhase;
  ddaOffset: number;           // -1, 0, +1
  rareBonus: number;           // -0.02, 0, +0.02
  paceSecPerWord: number;      // Average seconds per word in last 30s
  paceLabel: 'fast' | 'balanced' | 'slow';
  isSoftenedByDeadlock: boolean; // 30s soften active
}

/**
 * Calculates current base phase based on elapsed game time and total words cleared.
 */
export function getBasePhase(elapsedSeconds: number, wordsCleared: number): DifficultyPhase {
  // Phase 4 — MASTERY (360s+, or 60+ words)
  if (wordsCleared >= 60 || elapsedSeconds >= 360) return 4;
  // Phase 3 — CHALLENGE (180-360s, or 30-60 words)
  if (wordsCleared >= 30 || elapsedSeconds >= 180) return 3;
  // Phase 2 — FAMILIARIZE (60-180s, or 10-30 words)
  if (wordsCleared >= 10 || elapsedSeconds >= 60) return 2;
  // Phase 1 — WARM-UP (0-60s, or 0-10 words)
  return 1;
}

/**
 * Evaluates Dynamic Difficulty Adjustment based on rolling player performance:
 * - avg < 5s/word in last 30s -> increase difficulty (+1 phase or +2% rare)
 * - avg > 15s/word in last 30s -> decrease difficulty (-1 phase or -2% rare)
 * - 2 consecutive deadlocks -> force shuffle & soften difficulty for 30s
 */
export function calculateDDA(
  elapsedSeconds: number,
  wordsCleared: number,
  history: ClearedWordRecord[],
  deadlockCount: number,
  lastDeadlockSoftenedUntil: number,
  now: number = Date.now()
): DDAState {
  const basePhase = getBasePhase(elapsedSeconds, wordsCleared);
  const isSoftenedByDeadlock = now < lastDeadlockSoftenedUntil || deadlockCount >= 2;

  // Recent clears in last 30 seconds
  const recentWindowMs = 30000;
  const recentClears = history.filter((h) => now - h.timestamp <= recentWindowMs);

  let paceSecPerWord = 0;
  let paceLabel: 'fast' | 'balanced' | 'slow' = 'balanced';
  let ddaOffset = 0;
  let rareBonus = 0;

  if (recentClears.length >= 2) {
    const windowSpanSec = Math.max(5, (now - recentClears[0].timestamp) / 1000);
    paceSecPerWord = parseFloat((windowSpanSec / recentClears.length).toFixed(1));

    if (paceSecPerWord < 5.0 && recentClears.length >= 3) {
      paceLabel = 'fast';
      ddaOffset = +1;
      rareBonus = +0.02;
    } else if (paceSecPerWord > 15.0) {
      paceLabel = 'slow';
      ddaOffset = -1;
      rareBonus = -0.02;
    }
  } else if (elapsedSeconds >= 30 && recentClears.length <= 1) {
    // Player has been struggling without clearing words
    paceLabel = 'slow';
    paceSecPerWord = 20.0;
    ddaOffset = -1;
    rareBonus = -0.02;
  }

  // Deadlock softening takes precedence
  if (isSoftenedByDeadlock) {
    ddaOffset = Math.min(ddaOffset, -1);
    rareBonus = -0.02;
  }

  const effectivePhase = Math.max(1, Math.min(4, basePhase + ddaOffset)) as DifficultyPhase;

  return {
    basePhase,
    effectivePhase,
    ddaOffset,
    rareBonus,
    paceSecPerWord,
    paceLabel,
    isSoftenedByDeadlock,
  };
}

/**
 * Calculates percentage progress towards next phase.
 */
export function getPhaseProgress(
  phase: DifficultyPhase,
  elapsedSeconds: number,
  wordsCleared: number
): { percent: number; nextPhaseLabel: string; currentCount: number; targetCount: number } {
  if (phase === 4) {
    return {
      percent: 100,
      nextPhaseLabel: 'Max Mastery',
      currentCount: wordsCleared,
      targetCount: 60,
    };
  }

  const config = PHASE_CONFIGS[phase];
  const nextConfig = PHASE_CONFIGS[(phase + 1) as DifficultyPhase];

  const wordProgress = (wordsCleared - config.wordsRange[0]) / (config.wordsRange[1] - config.wordsRange[0]);
  const timeProgress = (elapsedSeconds - config.timeRangeSec[0]) / (config.timeRangeSec[1] - config.timeRangeSec[0]);

  // Player advances when either milestone is met
  const maxProgress = Math.min(1.0, Math.max(wordProgress, timeProgress));
  const percent = Math.round(maxProgress * 100);

  return {
    percent,
    nextPhaseLabel: nextConfig.name,
    currentCount: wordsCleared,
    targetCount: config.wordsRange[1],
  };
}
