/**
 * Urdu keyboard layout (the standard Pakistani layout). Keys are physical positions (KeyboardEvent.code), so the
 * layout works no matter which language the operating system keyboard is set to: press the "Q" key and you get ق.
 *
 * Each entry is [normal, shift]. A missing value means the key types its normal character.
 * Keys not listed here (` [ ] \ ' / and the bracket pairs) are left alone on purpose: they carry Markdown syntax
 * (code, links, escapes), so they keep typing the usual characters while Urdu is on.
 */
type Pair = [normal?: string, shift?: string];

/**
 * The standard layout types Latin digits on the number row, and so does this one. Set to true to type Urdu-Indic
 * digits (۱۲۳…) instead.
 */
const URDU_DIGITS = false;

export const URDU_LAYOUT: Record<string, Pair> = {
  // Number row: digits stay as they are. Shift keeps the usual symbols, except ^ which gives ۂ.
  Digit6: [undefined, "ۂ"],
  Minus: [undefined, "ـ"], //       shift: tatweel (kashida)
  Equal: ["ٓ", "ۤ"], //   maddah mark, shift: small maddah

  // Top row
  KeyQ: ["ق", "ﷺ"],
  KeyW: ["و", "ؤ"],
  KeyE: ["ع", "ؑ"], //         shift: alayhe assalam sign
  KeyR: ["ر", "ڑ"],
  KeyT: ["ت", "ٹ"],
  KeyY: ["ے", "ۓ"],
  KeyU: ["ئ", "ء"], //             hamza on yeh; shift: plain hamza
  KeyI: ["ی", "ٰ"], //         shift: dagger alif
  KeyO: ["ہ", "ۃ"],
  KeyP: ["پ", "ُ"], //         shift: pesh

  // Home row
  KeyA: ["ا", "آ"],
  KeyS: ["س", "ص"],
  KeyD: ["د", "ڈ"],
  KeyF: ["ف", "ٖ"], //         shift: subscript alef
  KeyG: ["گ", "غ"],
  KeyH: ["ھ", "ح"],
  KeyJ: ["ج", "ض"],
  KeyK: ["ک", "خ"],
  KeyL: ["ل", "ؒ"], //         shift: rahmatullah alayh sign
  Semicolon: ["؛"],

  // Bottom row
  KeyZ: ["ز", "ذ"],
  KeyX: ["ش", "ژ"],
  KeyC: ["چ", "ث"],
  KeyV: ["ط", "ظ"],
  KeyB: ["ب", "﷽"],
  KeyN: ["ن", "ں"],
  KeyM: ["م", "ؐ"], //         shift: sallallahu alayhi wasallam sign
  Comma: ["،", "ِ"], //        shift: zer
  Period: ["۔", "َ"], //       shift: zabar
  Slash: [undefined, "؟"],
};

if (URDU_DIGITS) {
  const digits = "۰۱۲۳۴۵۶۷۸۹";
  for (let n = 0; n <= 9; n++) {
    const code = `Digit${n}`;
    URDU_LAYOUT[code] = [digits[n], URDU_LAYOUT[code]?.[1]];
  }
}

/** The Urdu character for a physical key, or undefined when the key should type normally. */
export function urduForKey(code: string, shift: boolean): string | undefined {
  const pair = URDU_LAYOUT[code];
  if (!pair) return undefined;
  return shift ? pair[1] : pair[0];
}

// US QWERTY characters for each position. Phone keyboards report characters, not key positions,
// so the typed character is mapped back to its position first.
const US_CHARS: Record<string, [string, string]> = {
  Backquote: ["`", "~"],
  Digit1: ["1", "!"], Digit2: ["2", "@"], Digit3: ["3", "#"], Digit4: ["4", "$"], Digit5: ["5", "%"],
  Digit6: ["6", "^"], Digit7: ["7", "&"], Digit8: ["8", "*"], Digit9: ["9", "("], Digit0: ["0", ")"],
  Minus: ["-", "_"], Equal: ["=", "+"],
  BracketLeft: ["[", "{"], BracketRight: ["]", "}"], Backslash: ["\\", "|"],
  Semicolon: [";", ":"], Quote: ["'", '"'], Comma: [",", "<"], Period: [".", ">"], Slash: ["/", "?"],
};
for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") US_CHARS[`Key${c}`] = [c.toLowerCase(), c];

const CHAR_TO_URDU: Record<string, string> = {};
for (const [code, [plain, shifted]] of Object.entries(US_CHARS)) {
  const normal = urduForKey(code, false);
  const upper = urduForKey(code, true);
  if (normal) CHAR_TO_URDU[plain] = normal;
  if (upper) CHAR_TO_URDU[shifted] = upper;
}

/** The Urdu character for a typed Latin character (used when the browser gives no key position). */
export function urduForChar(char: string): string | undefined {
  return CHAR_TO_URDU[char];
}

export interface KeyDef {
  code: string;
  /** What the same key types on a US keyboard: [normal, shift]. */
  latin: [string, string];
}

const rowOf = (codes: string[]): KeyDef[] => codes.map((code) => ({ code, latin: US_CHARS[code] }));

/** The four character rows of a keyboard, for drawing the on-screen layout. Built from the same table as typing. */
export const KEY_ROWS: KeyDef[][] = [
  rowOf(["Backquote", ..."1234567890".split("").map((d) => `Digit${d}`), "Minus", "Equal"]),
  rowOf([..."QWERTYUIOP".split("").map((c) => `Key${c}`), "BracketLeft", "BracketRight", "Backslash"]),
  rowOf([..."ASDFGHJKL".split("").map((c) => `Key${c}`), "Semicolon", "Quote"]),
  rowOf([..."ZXCVBNM".split("").map((c) => `Key${c}`), "Comma", "Period", "Slash"]),
];

/** True for characters in the Arabic script blocks, which is where Urdu lives. */
export const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
