import type { ValueOf } from "./utility-types";
export declare const CODES: {
    readonly EQUAL: "Equal";
    readonly MINUS: "Minus";
    readonly NUM_ADD: "NumpadAdd";
    readonly NUM_SUBTRACT: "NumpadSubtract";
    readonly NUM_ZERO: "Numpad0";
    readonly BRACKET_RIGHT: "BracketRight";
    readonly BRACKET_LEFT: "BracketLeft";
    readonly ONE: "Digit1";
    readonly TWO: "Digit2";
    readonly THREE: "Digit3";
    readonly NINE: "Digit9";
    readonly QUOTE: "Quote";
    readonly ZERO: "Digit0";
    readonly SLASH: "Slash";
    readonly C: "KeyC";
    readonly D: "KeyD";
    readonly H: "KeyH";
    readonly V: "KeyV";
    readonly Z: "KeyZ";
    readonly Y: "KeyY";
    readonly R: "KeyR";
    readonly S: "KeyS";
};
export declare const KEYS: {
    readonly ARROW_DOWN: "ArrowDown";
    readonly ARROW_LEFT: "ArrowLeft";
    readonly ARROW_RIGHT: "ArrowRight";
    readonly ARROW_UP: "ArrowUp";
    readonly PAGE_UP: "PageUp";
    readonly PAGE_DOWN: "PageDown";
    readonly BACKSPACE: "Backspace";
    readonly ALT: "Alt";
    readonly CTRL_OR_CMD: "metaKey" | "ctrlKey";
    readonly DELETE: "Delete";
    readonly ENTER: "Enter";
    readonly ESCAPE: "Escape";
    readonly QUESTION_MARK: "?";
    readonly SPACE: " ";
    readonly TAB: "Tab";
    readonly CHEVRON_LEFT: "<";
    readonly CHEVRON_RIGHT: ">";
    readonly PERIOD: ".";
    readonly COMMA: ",";
    readonly SUBTRACT: "-";
    readonly SLASH: "/";
    readonly A: "a";
    readonly B: "b";
    readonly C: "c";
    readonly D: "d";
    readonly E: "e";
    readonly F: "f";
    readonly G: "g";
    readonly H: "h";
    readonly I: "i";
    readonly L: "l";
    readonly N: "n";
    readonly O: "o";
    readonly P: "p";
    readonly Q: "q";
    readonly R: "r";
    readonly S: "s";
    readonly T: "t";
    readonly V: "v";
    readonly X: "x";
    readonly Y: "y";
    readonly Z: "z";
    readonly K: "k";
    readonly W: "w";
    readonly 0: "0";
    readonly 1: "1";
    readonly 2: "2";
    readonly 3: "3";
    readonly 4: "4";
    readonly 5: "5";
    readonly 6: "6";
    readonly 7: "7";
    readonly 8: "8";
    readonly 9: "9";
};
export type Key = keyof typeof KEYS;
export declare const KeyCodeMap: Map<ValueOf<{
    readonly ARROW_DOWN: "ArrowDown";
    readonly ARROW_LEFT: "ArrowLeft";
    readonly ARROW_RIGHT: "ArrowRight";
    readonly ARROW_UP: "ArrowUp";
    readonly PAGE_UP: "PageUp";
    readonly PAGE_DOWN: "PageDown";
    readonly BACKSPACE: "Backspace";
    readonly ALT: "Alt";
    readonly CTRL_OR_CMD: "metaKey" | "ctrlKey";
    readonly DELETE: "Delete";
    readonly ENTER: "Enter";
    readonly ESCAPE: "Escape";
    readonly QUESTION_MARK: "?";
    readonly SPACE: " ";
    readonly TAB: "Tab";
    readonly CHEVRON_LEFT: "<";
    readonly CHEVRON_RIGHT: ">";
    readonly PERIOD: ".";
    readonly COMMA: ",";
    readonly SUBTRACT: "-";
    readonly SLASH: "/";
    readonly A: "a";
    readonly B: "b";
    readonly C: "c";
    readonly D: "d";
    readonly E: "e";
    readonly F: "f";
    readonly G: "g";
    readonly H: "h";
    readonly I: "i";
    readonly L: "l";
    readonly N: "n";
    readonly O: "o";
    readonly P: "p";
    readonly Q: "q";
    readonly R: "r";
    readonly S: "s";
    readonly T: "t";
    readonly V: "v";
    readonly X: "x";
    readonly Y: "y";
    readonly Z: "z";
    readonly K: "k";
    readonly W: "w";
    readonly 0: "0";
    readonly 1: "1";
    readonly 2: "2";
    readonly 3: "3";
    readonly 4: "4";
    readonly 5: "5";
    readonly 6: "6";
    readonly 7: "7";
    readonly 8: "8";
    readonly 9: "9";
}>, ValueOf<{
    readonly EQUAL: "Equal";
    readonly MINUS: "Minus";
    readonly NUM_ADD: "NumpadAdd";
    readonly NUM_SUBTRACT: "NumpadSubtract";
    readonly NUM_ZERO: "Numpad0";
    readonly BRACKET_RIGHT: "BracketRight";
    readonly BRACKET_LEFT: "BracketLeft";
    readonly ONE: "Digit1";
    readonly TWO: "Digit2";
    readonly THREE: "Digit3";
    readonly NINE: "Digit9";
    readonly QUOTE: "Quote";
    readonly ZERO: "Digit0";
    readonly SLASH: "Slash";
    readonly C: "KeyC";
    readonly D: "KeyD";
    readonly H: "KeyH";
    readonly V: "KeyV";
    readonly Z: "KeyZ";
    readonly Y: "KeyY";
    readonly R: "KeyR";
    readonly S: "KeyS";
}>>;
export declare const isLatinChar: (key: string) => boolean;
/**
 * Used to match key events for any keyboard layout, especially on Windows and Linux,
 * where non-latin character with modified (CMD) is not substituted with latin-based alternative.
 *
 * Uses `event.key` when it's latin, otherwise fallbacks to `event.code` (if mapping exists).
 *
 * Example of pressing "z" on different layouts, with the chosen key or code highlighted in []:
 *
 * Layout                | Code  | Key | Comment
 * --------------------- | ----- | --- | -------
 * U.S.                  |  KeyZ  | [z] |
 * Czech                 |  KeyY  | [z] |
 * Turkish               |  KeyN  | [z] |
 * French                |  KeyW  | [z] |
 * Macedonian            | [KeyZ] |  з  | z with cmd; з is Cyrillic equivalent of z
 * Russian               | [KeyZ] |  я  | z with cmd
 * Serbian               | [KeyZ] |  ѕ  | z with cmd
 * Greek                 | [KeyZ] |  ζ  | z with cmd; also ζ is Greek equivalent of z
 * Hebrew                | [KeyZ] |  ז  | z with cmd; also ז is Hebrew equivalent of z
 * Pinyin - Simplified   |  KeyZ  | [z] | due to IME
 * Cangije - Traditional | [KeyZ] |  重 | z with cmd
 * Japanese              | [KeyZ] |  つ | z with cmd
 * 2-Set Korean          | [KeyZ] |  ㅋ | z with cmd
 *
 * More details in https://github.com/excalidraw/excalidraw/pull/5944
 */
export declare const matchKey: (event: KeyboardEvent | React.KeyboardEvent<Element>, key: ValueOf<typeof KEYS>) => boolean;
export declare const isArrowKey: (key: string) => key is "ArrowDown" | "ArrowLeft" | "ArrowRight" | "ArrowUp";
export declare const shouldResizeFromCenter: (event: MouseEvent | KeyboardEvent) => boolean;
export declare const shouldMaintainAspectRatio: (event: MouseEvent | KeyboardEvent) => boolean;
export declare const shouldRotateWithDiscreteAngle: (event: MouseEvent | KeyboardEvent | React.PointerEvent<HTMLCanvasElement>) => boolean;
