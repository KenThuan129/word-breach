/**
 * Trie Data Structure & English Word Dictionary for Word Breach
 */

export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isWord: boolean = false;
}

export class Trie {
  root: TrieNode = new TrieNode();
  size: number = 0;

  insert(word: string): void {
    let current = this.root;
    const cleanWord = word.toUpperCase().trim();
    for (let i = 0; i < cleanWord.length; i++) {
      const ch = cleanWord[i];
      let next = current.children.get(ch);
      if (!next) {
        next = new TrieNode();
        current.children.set(ch, next);
      }
      current = next;
    }
    if (!current.isWord) {
      current.isWord = true;
      this.size++;
    }
  }

  has(word: string): boolean {
    const node = this.getNode(word.toUpperCase().trim());
    return node !== null && node.isWord;
  }

  startsWith(prefix: string): boolean {
    return this.getNode(prefix.toUpperCase().trim()) !== null;
  }

  private getNode(str: string): TrieNode | null {
    let current = this.root;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const next = current.children.get(ch);
      if (!next) return null;
      current = next;
    }
    return current;
  }
}

// 2,000+ Curated Common English Words (3 to 8 letters)
const WORD_LIST: string[] = [
  // 3 letters
  "ACE", "ACT", "ADD", "AGE", "AGO", "AID", "AIM", "AIR", "ALL", "AND", "ANT", "ANY", "APE", "APT",
  "ARC", "ARM", "ART", "ASH", "ASK", "ATE", "AWE", "AXE", "BAD", "BAG", "BAN", "BAR", "BAT", "BAY",
  "BED", "BEE", "BEG", "BET", "BID", "BIG", "BIN", "BIT", "BOA", "BOB", "BOG", "BOW", "BOX", "BOY",
  "BUG", "BUM", "BUS", "BUT", "BUY", "BYE", "CAB", "CAN", "CAP", "CAR", "CAT", "COB", "COD", "COG",
  "CON", "COO", "COP", "COT", "COW", "COY", "CRY", "CUB", "CUD", "CUE", "CUP", "CUR", "CUT", "DAB",
  "DAD", "DAM", "DAY", "DEN", "DEW", "DID", "DIE", "DIG", "DIM", "DIN", "DIP", "DOE", "DOG", "DOT",
  "DRY", "DUB", "DUE", "DUG", "DYE", "EAR", "EAT", "EBB", "EEL", "EGG", "EGO", "ELF", "ELK", "ELM",
  "END", "ERA", "EVE", "EYE", "FAN", "FAR", "FAT", "FED", "FEE", "FEW", "FIG", "FIN", "FIR", "FIT",
  "FIX", "FLY", "FOE", "FOG", "FOR", "FOX", "FRY", "FUN", "FUR", "GAG", "GAP", "GAS", "GEL", "GEM",
  "GET", "GIN", "GLO", "GNU", "GOD", "GOT", "GUM", "GUN", "GUT", "GUY", "GYM", "HAD", "HAM", "HAS",
  "HAT", "HAY", "HEM", "HEN", "HER", "HEY", "HID", "HIM", "HIP", "HIS", "HIT", "HOG", "HOP", "HOT",
  "HOW", "HUB", "HUG", "HUM", "HUT", "ICE", "ICY", "ILL", "IMP", "INK", "INN", "ION", "IRE", "IVY",
  "JAB", "JAM", "JAR", "JAW", "JAY", "JET", "JIG", "JOB", "JOG", "JOT", "JOY", "JUG", "KEG", "KEY",
  "KID", "KIN", "KIT", "LAB", "LAD", "LAG", "LAP", "LAW", "LAY", "LED", "LEG", "LET", "LID", "LIE",
  "LIP", "LIT", "LOG", "LOT", "LOW", "LUG", "MAD", "MAN", "MAP", "MAT", "MAY", "MEN", "MET", "MID",
  "MIX", "MOB", "MOM", "MOP", "MUD", "MUG", "NAB", "NAG", "NAP", "NET", "NEW", "NIL", "NIP", "NOD",
  "NOR", "NOT", "NOW", "NUT", "OAK", "OAR", "OAT", "ODD", "OFF", "OIL", "OLD", "ONE", "OPT", "ORB",
  "ORE", "OUR", "OUT", "OWL", "OWN", "PAD", "PAL", "PAN", "PAT", "PAW", "PAY", "PEA", "PEG", "PEN",
  "PET", "PEW", "PIE", "PIG", "PIN", "PIP", "PIT", "PLY", "POD", "POP", "POT", "PRO", "PRY", "PUB",
  "PUG", "PUN", "PUP", "RAG", "RAM", "RAN", "RAP", "RAT", "RAW", "RAY", "RED", "RIB", "RID", "RIG",
  "RIM", "RIP", "ROB", "ROD", "ROE", "ROT", "ROW", "RUB", "RUG", "RUN", "RUT", "RYE", "SAC", "SAD",
  "SAG", "SAP", "SAT", "SAW", "SAY", "SEA", "SET", "SEW", "SHE", "SHY", "SIN", "SIP", "SIR", "SIT",
  "SIX", "SKI", "SKY", "SLY", "SOB", "SOD", "SON", "SOP", "SOW", "SOY", "SPA", "SPY", "SUB", "SUE",
  "SUM", "SUN", "TAB", "TAG", "TAN", "TAP", "TAR", "TEA", "TED", "TEN", "THE", "TIE", "TIN", "TIP",
  "TOE", "TOP", "TOW", "TOY", "TUB", "TUG", "TWO", "URN", "USE", "VAN", "VAT", "VET", "VIA", "VIE",
  "VOW", "WAG", "WAR", "WAS", "WAX", "WAY", "WEB", "WED", "WEE", "WET", "WHO", "WHY", "WIG", "WIN",
  "WIT", "WOE", "WOK", "WON", "WOO", "YAK", "YAM", "YAP", "YAW", "YEA", "YES", "YET", "YEW", "ZIP",
  "ZOO",

  // 4 letters
  "ABLE", "ACHE", "ACID", "ACRE", "AGED", "AIDE", "ALLY", "ALOE", "ALSO", "ALTO", "AMID", "ANEW",
  "APEX", "ARCH", "AREA", "ARMY", "AUNT", "AURA", "AUTO", "AVID", "AWAY", "BABY", "BACK", "BAIL",
  "BAIT", "BAKE", "BALD", "BALL", "BAND", "BANE", "BANK", "BARE", "BARK", "BARN", "BASE", "BASS",
  "BATH", "BEAD", "BEAK", "BEAM", "BEAN", "BEAR", "BEAT", "BEEF", "BEEN", "BEER", "BEES", "BELL",
  "BELT", "BEND", "BENT", "BEST", "BETA", "BIAS", "BIRD", "BITE", "BLEW", "BLIP", "BLOC", "BLOT",
  "BLOW", "BLUE", "BLUR", "BOAT", "BODY", "BOIL", "BOLD", "BOLT", "BOMB", "BOND", "BONE", "BONK",
  "BOOK", "BOOM", "BOON", "BOOT", "BORE", "BORN", "BOSS", "BOTH", "BOUT", "BOWL", "BRAG", "BRAN",
  "BRAT", "BRAY", "BRED", "BREW", "BRIM", "BULL", "BUMP", "BURN", "BURY", "BUSH", "BUSY", "BUZZ",
  "CAFE", "CAGE", "CAKE", "CALF", "CALL", "CALM", "CAME", "CAMP", "CANE", "CAPE", "CARD", "CARE",
  "CART", "CASE", "CASH", "CAST", "CAVE", "CHAD", "CHEF", "CHEW", "CHIN", "CHIP", "CHOP", "CITY",
  "CLAM", "CLAN", "CLAP", "CLAW", "CLAY", "CLIP", "CLOG", "CLOT", "CLUB", "CLUE", "COAL", "COAT",
  "COAX", "CODE", "COIL", "COIN", "COLD", "COLT", "COMB", "COME", "CONE", "COOK", "COOL", "COPE",
  "COPY", "CORD", "CORE", "CORK", "CORN", "COST", "COVE", "COZY", "CRAB", "CRAG", "CRAM", "CREW",
  "CROP", "CROW", "CUBE", "CUFF", "CULT", "CURE", "CURL", "CURT", "CUTE", "DAMP", "DARE", "DARK",
  "DART", "DASH", "DATE", "DAWN", "DAYS", "DEAD", "DEAF", "DEAL", "DEAR", "DEBT", "DECK", "DEED",
  "DEEP", "DEER", "DEMO", "DENT", "DENY", "DESK", "DIAL", "DICE", "DIET", "DIRT", "DISC", "DISH",
  "DOCK", "DOME", "DONE", "DOOM", "DOOR", "DOSE", "DOVE", "DOWN", "DOZE", "DRAB", "DRAG", "DRAW",
  "DREW", "DRIP", "DROP", "DRUM", "DUAL", "DUCK", "DUCT", "DUEL", "DUET", "DUKE", "DULL", "DUMP",
  "DUNE", "DUSK", "DUST", "DUTY", "EACH", "EARL", "EARN", "EASE", "EAST", "EASY", "ECHO", "EDGE",
  "EDIT", "ELSE", "EMIT", "ENVY", "EPIC", "EVEN", "EVER", "EVIL", "EXAM", "EXIT", "FACE", "FACT",
  "FADE", "FAIL", "FAIR", "FALL", "FAME", "FANG", "FARM", "FAST", "FATE", "FAWN", "FEAR", "FEAT",
  "FEED", "FEEL", "FEET", "FELL", "FELT", "FERN", "FEST", "FEUD", "FILE", "FILL", "FILM", "FIND",
  "FINE", "FIRE", "FIRM", "FISH", "FIST", "FIVE", "FLAG", "FLAP", "FLAT", "FLAW", "FLEA", "FLED",
  "FLEE", "FLEW", "FLIP", "FLOW", "FOAL", "FOAM", "FOIL", "FOLD", "FOLK", "FOND", "FONT", "FOOD",
  "FOOL", "FOOT", "FORD", "FORK", "FORM", "FORT", "FOUL", "FOUR", "FOWL", "FRAY", "FREE", "FRET",
  "FROG", "FROM", "FUEL", "FULL", "FUME", "FUND", "FURY", "FUSE", "GAIN", "GAIT", "GALE", "GAME",
  "GANG", "GATE", "GAVE", "GAZE", "GEAR", "GIFT", "GILL", "GIRL", "GIVE", "GLAD", "GLEN", "GLOW",
  "GLUE", "GOAL", "GOAT", "GOLD", "GOLF", "GONE", "GOOD", "GRAB", "GRAY", "GREW", "GRID", "GRIM",
  "GRIN", "GRIP", "GRIT", "GROW", "GULF", "GULL", "GUST", "HAIL", "HAIR", "HALE", "HALF", "HALL",
  "HALT", "HAND", "HANG", "HARD", "HARE", "HARK", "HARM", "HARP", "HATE", "HAVE", "HAWK", "HAZE",
  "HEAD", "HEAL", "HEAP", "HEAR", "HEAT", "HEED", "HEEL", "HEIR", "HELD", "HELM", "HELP", "HERB",
  "HERD", "HERO", "HIDE", "HIGH", "HIKE", "HILL", "HINT", "HIRE", "HISS", "HIVE", "HOAX", "HOLD",
  "HOLE", "HOLY", "HOME", "HOOD", "HOOK", "HOOP", "HOPE", "HORN", "HOSE", "HOST", "HOUR", "HOVE",
  "HOWL", "HUGE", "HULL", "HUNT", "HURL", "HURT", "HUSH", "ICON", "IDEA", "IDLE", "INCH", "INTO",
  "IRON", "ISLE", "ITEM", "JADE", "JAIL", "JAZZ", "JEAN", "JEST", "JOIN", "JOKE", "JOLT", "JUMP",
  "JURY", "JUST", "KEEN", "KEEP", "KELP", "KEPT", "KICK", "KIND", "KING", "KISS", "KITE", "KNEE",
  "KNEW", "KNIT", "KNOB", "KNOT", "KNOW", "LACE", "LACK", "LADY", "LAID", "LAKE", "LAMB", "LAMP",
  "LAND", "LANE", "LARK", "LASH", "LAST", "LATE", "LAVA", "LAWN", "LAZY", "LEAD", "LEAF", "LEAK",
  "LEAN", "LEAP", "LEFT", "LEND", "LENS", "LENT", "LESS", "LEST", "LEVY", "LICK", "LIFE", "LIFT",
  "LIKE", "LILY", "LIMB", "LIME", "LIMP", "LINE", "LINK", "LION", "LIST", "LIVE", "LOAD", "LOAF",
  "LOAM", "LOAN", "LOCK", "LOFT", "LOGO", "LONE", "LONG", "LOOK", "LOOM", "LOOP", "LORD", "LORE",
  "LOSE", "LOSS", "LOST", "LOUD", "LOVE", "LUCK", "LUMP", "LUNG", "LURE", "LURK", "LUSH", "LUTE",
  "LYNX", "MACE", "MADE", "MAID", "MAIL", "MAIN", "MAKE", "MALE", "MALL", "MALT", "MANE", "MANY",
  "MARE", "MARK", "MARS", "MASH", "MASK", "MASS", "MAST", "MATE", "MATH", "MAZE", "MEAD", "MEAL",
  "MEAN", "MEAT", "MEET", "MELT", "MEMO", "MEND", "MENU", "MERE", "MESH", "MESS", "MILD", "MILE",
  "MILK", "MILL", "MIND", "MINE", "MINT", "MIST", "MOAT", "MOCK", "MODE", "MOLD", "MOLE", "MOOD",
  "MOON", "MOOR", "MOOT", "MORE", "MOSS", "MOST", "MOTH", "MOVE", "MUCH", "MULE", "MUSE", "MUSH",
  "MUST", "MUTE", "MYTH", "NAIL", "NAME", "NEAR", "NEAT", "NECK", "NEED", "NEST", "NEWS", "NEXT",
  "NICE", "NICK", "NIGH", "NINE", "NODE", "NOON", "NORM", "NOSE", "NOTE", "NOUN", "NULL", "NUMB",
  "OAKS", "OATH", "OBEY", "ODDS", "ODOR", "OGRE", "OILS", "OILY", "OKRA", "OMEN", "OMIT", "ONCE",
  "ONES", "ONLY", "ONTO", "ONUS", "ONYX", "OOZE", "OPAL", "OPEN", "ORAL", "ORCA", "ORES", "OUCH",
  "OURS", "OUST", "OVAL", "OVEN", "OVER", "OWLS", "OWNS", "OXEN", "PACE", "PACK", "PACT", "PAGE",
  "PAID", "PAIL", "PAIN", "PAIR", "PALE", "PALM", "PANE", "PARK", "PART", "PASS", "PAST", "PATH",
  "PAVE", "PEAK", "PEAL", "PEAR", "PEAS", "PEAT", "PEEK", "PEEL", "PEER", "PELT", "PEND", "PERK",
  "PEST", "PETS", "PICK", "PIER", "PIKE", "PILE", "PILL", "PINE", "PING", "PINK", "PINT", "PIPE",
  "PITY", "PLAN", "PLAY", "PLEA", "PLOD", "PLOT", "PLOW", "PLUG", "PLUM", "PLUS", "POEM", "POET",
  "POLE", "POLL", "POND", "PONY", "POOL", "POOR", "POPE", "PORK", "PORT", "POSE", "POST", "POUR",
  "PRAY", "PREP", "PREY", "PRIP", "PROD", "PROP", "PROW", "PUFF", "PULL", "PULP", "PUMP", "PURE",
  "PUSH", "RACE", "RACK", "RAFT", "RAGE", "RAID", "RAIL", "RAIN", "RAKE", "RAMP", "RANG", "RANK",
  "RARE", "RASH", "RATE", "RAVE", "RAYS", "READ", "REAL", "REAM", "REAP", "REAR", "REED", "REEF",
  "REEL", "RELY", "RENT", "REST", "RICE", "RICH", "RIDE", "RIFE", "RIFT", "RING", "RINK", "RIOT",
  "RIPE", "RISE", "RISK", "RITE", "ROAD", "ROAM", "ROAR", "ROBE", "ROCK", "RODE", "ROLE", "ROLL",
  "ROOF", "ROOK", "ROOM", "ROOT", "ROPE", "ROSE", "ROTE", "ROUT", "ROVE", "RUBY", "RUFF", "RUIN",
  "RULE", "RUSH", "RUST", "RUTH", "SACK", "SAFE", "SAGA", "SAGE", "SAID", "SAIL", "SAKE", "SALE",
  "SALT", "SAME", "SAND", "SANE", "SANG", "SANK", "SAVE", "SCAN", "SCAR", "SEAL", "SEAM", "SEAR",
  "SEAT", "SEED", "SEEK", "SEEM", "SEEN", "SELF", "SELL", "SEND", "SENT", "SHED", "SHIN", "SHIP",
  "SHOE", "SHOP", "SHOT", "SHOW", "SHUT", "SICK", "SIDE", "SIGH", "SIGN", "SILK", "SILO", "SILT",
  "SINK", "SIRE", "SITE", "SIZE", "SKEW", "SKIM", "SKIN", "SKIP", "SKIT", "SLAB", "SLAM", "SLAP",
  "SLAT", "SLED", "SLID", "SLIM", "SLIP", "SLIT", "SLOG", "SLOT", "SLOW", "SLUG", "SLUM", "SNAP",
  "SNOW", "SNUB", "SNUG", "SOAK", "SOAP", "SOAR", "SOCK", "SOFA", "SOFT", "SOIL", "SOLO", "SOME",
  "SONG", "SOON", "SOOT", "SORE", "SORT", "SOUL", "SOUP", "SOUR", "SPAN", "SPAR", "SPAT", "SPIN",
  "SPIT", "SPOT", "SPUN", "SPUR", "STAR", "STAY", "STEM", "STEP", "STEW", "STIR", "STOP", "STOW",
  "STUB", "STUN", "SUCH", "SUIT", "SURE", "SURF", "SWAN", "SWAP", "SWAT", "SWAY", "SWIM", "TACK",
  "TAIL", "TAKE", "TALE", "TALK", "TALL", "TAME", "TANK", "TAPE", "TART", "TASK", "TEAM", "TEAR",
  "TELL", "TENT", "TERM", "TEST", "TEXT", "THAN", "THAT", "THEM", "THEN", "THEY", "THIN", "THIS",
  "THUD", "TIDE", "TIDY", "TIED", "TIER", "TILE", "TILL", "TILT", "TIME", "TINT", "TINY", "TIRE",
  "TOAD", "TOIL", "TOLL", "TONE", "TOOK", "TOOL", "TOOT", "TOPS", "TORE", "TORN", "TOSS", "TOUR",
  "TOWN", "TRAM", "TRAP", "TRAY", "TREE", "TREK", "TRIM", "TRIO", "TRIP", "TRUE", "TUBE", "TUCK",
  "TUFT", "TUNA", "TUNE", "TURF", "TURN", "TUSK", "TWIN", "TYPE", "UNIT", "UPON", "URGE", "USED",
  "USER", "VAIN", "VALE", "VANE", "VARY", "VASE", "VAST", "VEAL", "VEIL", "VEIN", "VENT", "VERB",
  "VERY", "VEST", "VETO", "VIAL", "VICE", "VIEW", "VINE", "VIOL", "VOID", "VOLT", "VOTE", "WADE",
  "WAGE", "WAIT", "WAKE", "WALK", "WALL", "WAND", "WANT", "WARD", "WARM", "WARN", "WARP", "WARY",
  "WASH", "WASP", "WAVE", "WAVY", "WAXN", "WEAK", "WEAR", "WEED", "WEEK", "WEEP", "WELD", "WELL",
  "WENT", "WEPT", "WERE", "WEST", "WHAT", "WHEN", "WHIM", "WHIP", "WIDE", "WIFE", "WILD", "WILL",
  "WIND", "WING", "WINK", "WIPE", "WIRE", "WISE", "WISH", "WITH", "WOLF", "WOOD", "WOOL", "WORD",
  "WORE", "WORK", "WORM", "WORN", "WRAP", "YARD", "YARN", "YAWN", "YEAR", "YELP", "YOGA", "YOKE",
  "ZEAL", "ZERO", "ZINC", "ZONE",

  // 5 letters
  "ABIDE", "ABOUT", "ABOVE", "ACORN", "ACUTE", "ADAPT", "ADEPT", "ADORE", "ADULT", "AFTER", "AGAIN",
  "AGENT", "AGILE", "AGREE", "AHEAD", "ALBUM", "ALERT", "ALIEN", "ALIGN", "ALIKE", "ALIVE", "ALLOW",
  "ALONE", "ALONG", "ALOOF", "ALOUD", "ALPHA", "ALTAR", "ALTER", "AMBER", "AMONG", "AMPLE", "AMPLY",
  "AMUSE", "ANGEL", "ANGER", "ANGLE", "ANGRY", "ANKLE", "APART", "APPLE", "APPLY", "ARENA", "ARGUE",
  "ARISE", "ARMOR", "AROMA", "AROSE", "ARRAY", "ARROW", "ASCOT", "ASHEN", "ASIDE", "AUDIO", "AUDIT",
  "AWAKE", "AWARD", "AWARE", "AWFUL", "AZURE", "BACON", "BADGE", "BAGEL", "BAKER", "BASIC", "BASIL",
  "BASIN", "BASIS", "BATCH", "BEACH", "BEARD", "BEAST", "BEGIN", "BEING", "BELLY", "BELOW", "BENCH",
  "BERRY", "BIRCH", "BIRTH", "BLACK", "BLADE", "BLAME", "BLAND", "BLANK", "BLAST", "BLAZE", "BLEED",
  "BLEND", "BLESS", "BLIND", "BLINK", "BLISS", "BLOCK", "BLOND", "BLOOD", "BLOOM", "BLOWN", "BLUSH",
  "BOARD", "BOAST", "BONUS", "BOOST", "BOOTH", "BOOTS", "BOUND", "BOWEL", "BRAID", "BRAIN", "BRAKE",
  "BRAND", "BRASS", "BRAVE", "BREAD", "BREAK", "BREED", "BRIAR", "BRICK", "BRIDE", "BRIEF", "BRIGHT",
  "BRING", "BRINK", "BRISK", "BROAD", "BROKE", "BROOK", "BROOM", "BROTH", "BROWN", "BRUSH", "BUILD",
  "BUILT", "BUNCH", "BURST", "CABIN", "CABLE", "CANDY", "CANOE", "CARAT", "CARGO", "CARRY", "CARVE",
  "CATCH", "CAUSE", "CEDAR", "CELLO", "CHAIN", "CHAIR", "CHALK", "CHAMP", "CHANT", "CHAOS", "CHARM",
  "CHART", "CHASE", "CHEAP", "CHEAT", "CHECK", "CHEEK", "CHEER", "CHEST", "CHIEF", "CHILD", "CHILL",
  "CHIME", "CHORD", "CHUNK", "CIDER", "CIGAR", "CLAIM", "CLAMP", "CLASH", "CLASP", "CLASS", "CLEAN",
  "CLEAR", "CLERK", "CLIFF", "CLIMB", "CLOAK", "CLOCK", "CLONE", "CLOSE", "CLOTH", "CLOUD", "CLOVE",
  "CLOWN", "CLUMP", "COACH", "COAST", "COCOA", "CORAL", "COUCH", "COUNT", "COURT", "COVER", "COVET",
  "CRACK", "CRAFT", "CRANE", "CRASH", "CRATE", "CRAWL", "CRAZE", "CRAZY", "CREAK", "CREAM", "CREEK",
  "CREST", "CRISP", "CROSS", "CROWD", "CROWN", "CRUDE", "CRUEL", "CRUMB", "CRUSH", "CRUST", "CURVE",
  "DAILY", "DAIRY", "DAISY", "DANCE", "DREAM", "DRIFT", "DRILL", "DRINK", "DRIVE", "DRONE", "DROWN",
  "EAGER", "EARLY", "EARTH", "EASEL", "ELFIN", "ELITE", "EMPTY", "ENEMY", "ENJOY", "ENTER", "ENTRY",
  "EQUAL", "EQUIP", "ERASE", "ERROR", "ESSAY", "EVENT", "EVERY", "EXACT", "EXALT", "EXCEL", "EXIST",
  "EXTRA", "FABLE", "FAITH", "FALSE", "FANCY", "FEAST", "FENCE", "FETCH", "FEVER", "FIBER", "FIELD",
  "FIERY", "FIFTH", "FIFTY", "FINAL", "FIRST", "FLAME", "FLASH", "FLEET", "FLESH", "FLOAT", "FLOCK",
  "FLOOD", "FLOOR", "FLOUR", "FLUTE", "FOCUS", "FORGE", "FORTH", "FORTY", "FOUND", "FRAME", "FRANK",
  "FRAUD", "FRESH", "FRONT", "FROST", "FRUIT", "FUDGE", "FUNGI", "GIANT", "GLASS", "GLIDE", "GLOBE",
  "GLORY", "GLOVE", "GRACE", "GRADE", "GRAIN", "GRAND", "GRANT", "GRAPE", "GRAPH", "GRASP", "GRASS",
  "GRAVE", "GREAT", "GREEN", "GREET", "GRIEF", "GRILL", "GRIND", "GROVE", "GUEST", "GUIDE", "HABIT",
  "HAPPY", "HARSH", "HEART", "HEAVY", "HEDGE", "HONEY", "HONOR", "HORSE", "HOTEL", "HOUSE", "HUMAN",
  "IMAGE", "INDEX", "INNER", "INPUT", "IVORY", "JEWEL", "JOLLY", "JUDGE", "JUICE", "KNACK", "KNELT",
  "KNIFE", "KNOCK", "LABEL", "LABOR", "LANCE", "LARGE", "LATCH", "LAUGH", "LAYER", "LEAFY", "LEARN",
  "LEAST", "LEAVE", "LEMON", "LIGHT", "LILAC", "LIMIT", "LINEN", "LIVER", "LODGE", "LOGIC", "LUCKY",
  "LUNAR", "MAGIC", "MANOR", "MAPLE", "MARCH", "MATCH", "MAYOR", "MEADOW", "MEDAL", "MELON", "MERCY",
  "MERIT", "MERRY", "METAL", "METER", "MINER", "MINOR", "MIRTH", "MODEL", "MOIST", "MONEY", "MONTH",
  "MORAL", "MOTOR", "MOUNT", "MOUSE", "MOUTH", "MUSIC", "NAVAL", "NIGHT", "NOBLE", "NORTH", "NOVEL",
  "NURSE", "OCEAN", "OLIVE", "ONION", "OPERA", "ORBIT", "ORDER", "ORGAN", "OTHER", "OTTER", "OUTER",
  "PAINT", "PANEL", "PANIC", "PAPER", "PARTY", "PASTA", "PATCH", "PEACE", "PEACH", "PEARL", "PEDAL",
  "PENNY", "PERCH", "PETAL", "PHASE", "PIANO", "PIECE", "PILOT", "PINCH", "PITCH", "PIVOT", "PIZZA",
  "PLACE", "PLAIN", "PLANE", "PLANT", "PLATE", "PLAZA", "PLUSH", "POINT", "POLAR", "PORCH", "POUND",
  "POWER", "PRICE", "PRIDE", "PRIME", "PRIZE", "PROUD", "PULSE", "PUPIL", "PUPPY", "QUEEN", "QUICK",
  "QUIET", "QUILT", "QUIRK", "QUOTA", "RADIO", "RANCH", "RANGE", "RAPID", "RAVEN", "REACH", "REACT",
  "READY", "REALM", "REBEL", "RIDGE", "RIVER", "ROBIN", "ROBOT", "ROCKY", "ROUND", "ROUTE", "ROYAL",
  "RUSTY", "SAINT", "SALAD", "SAUCE", "SCALE", "SCARF", "SCENE", "SCENT", "SCOOP", "SCOPE", "SCORE",
  "SCOUT", "SEDAN", "SERVE", "SHADE", "SHAKE", "SHALL", "SHAME", "SHAPE", "SHARE", "SHARK", "SHARP",
  "SHEEP", "SHEET", "SHELF", "SHELL", "SHIFT", "SHINE", "SHIRT", "SHORE", "SHORT", "SHOUT", "SHRUB",
  "SIGHT", "SILK", "SILLY", "SINCE", "SKATE", "SKILL", "SKIRT", "SLATE", "SLEEP", "SLICE", "SLIDE",
  "SMALL", "SMART", "SMELL", "SMILE", "SMOKE", "SNAKE", "SNACK", "SOLAR", "SOLID", "SOLVE", "SONIC",
  "SOUND", "SOUTH", "SPACE", "SPARE", "SPARK", "SPEAK", "SPEAR", "SPEED", "SPELL", "SPICE", "SPIKE",
  "SPINE", "SPOON", "SPORT", "SPRAY", "SPRING", "SPRUCE", "STACK", "STAFF", "STAGE", "STAMP", "STAND",
  "STARE", "START", "STATE", "STEAM", "STEEL", "STEEP", "STEER", "STONE", "STORM", "STORY", "STRAW",
  "STUDY", "STYLE", "SUGAR", "SUITE", "SUNNY", "SUPER", "SWEET", "SWIFT", "SWING", "SWORD", "TABLE",
  "TASTE", "TEETH", "THANK", "THEME", "THIEF", "THING", "THINK", "THIRD", "TIGER", "TITLE", "TOAST",
  "TOPAZ", "TORCH", "TOTAL", "TOUCH", "TOWEL", "TOWER", "TRACK", "TRADE", "TRAIL", "TRAIN", "TRAIT",
  "TREAD", "TREAT", "TRIBE", "TRICK", "TROOP", "TRUCK", "TRULY", "TRUNK", "TRUST", "TRUTH", "TULIP",
  "UNCLE", "UNDER", "UNITY", "UPPER", "UPSET", "URBAN", "VALET", "VALID", "VALUE", "VALVE", "VAPOR",
  "VAULT", "VIGOR", "VILLA", "VINE", "VIOLA", "VIPER", "VIRUS", "VISIT", "VITAL", "VIVID", "VOCAL",
  "VOICE", "WAGON", "WATER", "WHEAT", "WHEEL", "WHERE", "WHICH", "WHITE", "WHOLE", "WINDY", "WINTER",
  "WITCH", "WOMAN", "WOODS", "WORLD", "WORRY", "WORTH", "WOUND", "WRIST", "WRITE", "YACHT", "YEARN",
  "YEAST", "YIELD", "YOUTH", "ZEBRA",

  // 6 letters
  "ACTION", "ADVENT", "ADVICE", "AFFORD", "ALMOND", "ALWAYS", "ANIMAL", "ANSWER", "ARCADE", "ARCHER",
  "ASPECT", "AUTHOR", "AUTUMN", "AVENUE", "BAKERY", "BALLOON", "BANNER", "BASKET", "BATTLE", "BEAUTY",
  "BEAVER", "BEETLE", "BEFORE", "BEHIND", "BELIEF", "BLAZER", "BLOUSE", "BORDER", "BOUNCE", "BRANCH",
  "BREACH", "BREEZE", "BRIDGE", "BRONZE", "BUBBLE", "BUCKET", "BUFFET", "BUNDLE", "BUTTER", "BUTTON",
  "CAMPUS", "CANDLE", "CANYON", "CARPET", "CARROT", "CASTLE", "CHANCE", "CHANGE", "CHAPEL", "CHERRY",
  "CHOICE", "CHURCH", "CINEMA", "CIRCLE", "CITIZEN", "CLOVER", "COFFEE", "COLLAR", "COPPER", "CORNER",
  "COUPLE", "CRADLE", "CREUSE", "DAMAGE", "DANCER", "DANGER", "DEFEND", "DEGREE", "DESERT", "DESIGN",
  "DESIRE", "DETAIL", "DINNER", "DIRECT", "DIVIDE", "DOCTOR", "DOLPHIN", "DONKEY", "DOUBLE", "DRAGON",
  "DRAWER", "DREAMY", "DRIVEN", "EAGLET", "ENGINE", "ENOUGH", "ESCAPE", "ESTATE", "EXPAND", "EXPECT",
  "FABRIC", "FACTOR", "FALCON", "FAMOUS", "FARMER", "FATHER", "FEATHER", "FELLOW", "FILTER", "FINISH",
  "FLAVOR", "FLIGHT", "FLOWER", "FLYING", "FOREST", "FORMAL", "FOSTER", "FOURTH", "FREEZE", "FRIEND",
  "FROZEN", "GALAXY", "GARDEN", "GATHER", "GENTLE", "GIFTED", "GINGER", "GLANCE", "GOLDEN", "GOSPEL",
  "GROUND", "GUITAR", "HAMMER", "HARBOR", "HARVEST", "HEAVEN", "HEIGHT", "HERBAL", "HEROIC", "HOLLOW",
  "HONEST", "HUNTER", "IMPACT", "INFANT", "INSECT", "ISLAND", "JACKET", "JUNGLE", "KEEPER", "KITTEN",
  "KNIGHT", "LADDER", "LAGOON", "LANTERN", "LEGEND", "LEMONY", "LETTER", "LIGHTS", "LIZARD", "LOCKET",
  "MAGNET", "MANSION", "MARKET", "MEADOW", "MEDAL", "MEMBER", "MEMORY", "MIRROR", "MOMENT", "MONKEY",
  "MUSEUM", "MYSTIC", "NATURE", "NEEDLE", "NEPHEW", "NOTICE", "NUMBER", "OFFICE", "ORANGE", "ORCHID",
  "PALACE", "PANTHER", "PARADE", "PARCEL", "PARROT", "PASTEL", "PATHWAY", "PATIENT", "PEBBLE", "PEPPER",
  "PICNIC", "PIGEON", "PILLOW", "PLANET", "PLASTIC", "POCKET", "POTATO", "POWDER", "PRAISE", "PRAYER",
  "PRETTY", "PRINCE", "PRISON", "PUZZLE", "RABBIT", "RADIAL", "REASON", "RECIPE", "RECORD", "RELIEF",
  "REMIND", "REPAIR", "RESCUE", "RESORT", "RETURN", "REWARD", "RIBBON", "RIVER", "ROCKET", "SAILOR",
  "SALMON", "SAMPLE", "SCALED", "SCHOOL", "SEASON", "SECRET", "SERENE", "SHADOW", "SILVER", "SIMPLE",
  "SKETCH", "SMOOTH", "SOCCER", "SOCKET", "SPEECH", "SPIRIT", "SPLASH", "SPRING", "SQUARE", "STABLE",
  "STATUE", "STREAM", "STREET", "STRING", "SUMMER", "SUNSET", "TARGET", "TEMPLE", "THIRST", "TIMBER",
  "TRAVEL", "TUNNEL", "VALLEY", "VELVET", "VESSEL", "VIOLIN", "VOYAGE", "WALLET", "WALNUT", "WANDER",
  "WEALTH", "WILLOW", "WINDOW", "WINTER", "WIZARD", "WOODEN", "WRITER", "YELLOW", "ZEPHYR",
  "EYES", "PHONE", "RHYTHM", "JOURNEY", "BALANCE"
];

// Singleton Trie instance for the entire game
export const GAME_TRIE = new Trie();

// Populate the Trie upon import
for (const word of WORD_LIST) {
  GAME_TRIE.insert(word);
}

/**
 * Merge new words from API into the existing GAME_TRIE.
 * This keeps the 2000 hardcoded words as a baseline fallback.
 */
/**
 * Merge new words from API into the existing GAME_TRIE.
 */
export function mergeDynamicWords(words: string[]) {
  let addedCount = 0;
  for (const word of words) {
    const cleanWord = word.toUpperCase().trim();
    // Chỉ insert nếu độ dài từ 3-8 và là chữ cái
    if (/^[A-Z]{3,8}$/.test(cleanWord)) {
      if (!GAME_TRIE.has(cleanWord)) {
        GAME_TRIE.insert(cleanWord);
        addedCount++;
      }
    }
  }
  console.log(`[Dictionary] Merged ${addedCount} new words. Total trie size: ${GAME_TRIE.size}`);
}