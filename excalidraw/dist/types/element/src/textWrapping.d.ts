import type { FontString } from "./types";
/**
 * Test if a given text contains any CJK characters (including symbols, punctuation, etc,).
 */
export declare const containsCJK: (text: string) => boolean;
/**
 * Breaks the line into the tokens based on the found line break opporutnities.
 *
 * Note: tokenization normalizes to NFC first so decomposed graphemes are treated as
 * their composed variants for wrapping. Any code that needs exact source offsets should
 * keep in mind that this assumes the input text is already NFC-normalized.
 */
export declare const parseTokens: (line: string) => string[];
/**
 * Wraps the original text into the lines based on the given width.
 *
 * This is a convenience adapter over `getWrappedTextLines()` for call sites
 * that only need the rendered wrapped string and not the source offsets.
 */
export declare const wrapText: (text: string, font: FontString, maxWidth: number) => string;
/**
 * A single rendered visual line produced from the original text.
 *
 * `start` and `end` are end-exclusive code-unit offsets into the original text, and do
 * not include synthetic soft line breaks inserted by this module. If trailing whitespace
 * was trimmed away at a wrap boundary, `end` points to the last rendered character.
 */
export type WrappedTextLine = {
    text: string;
    start: number;
    end: number;
};
/**
 * Returns the rendered visual lines together with their source offsets.
 *
 * This is the source-of-truth wrapping pipeline for callers that need more than the
 * final wrapped string, for example caret placement or future editor/rich-text mapping.
 */
export declare const getWrappedTextLines: (text: string, font: FontString, maxWidth: number) => WrappedTextLine[];
