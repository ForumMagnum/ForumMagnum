import type { FontFamilyValues } from "../../../element/src/types";
import type { TopPicksDnD } from "../TopPicksDnD/topPicksDnD";
export type FontPickerDnD = TopPicksDnD<FontFamilyValues>;
export declare const FontPickerDnDContext: import("react").Context<FontPickerDnD | null>;
export declare const useFontPickerDnD: () => FontPickerDnD | null;
/** pinning fonts from the font picker list to the top-picks strip, and
 * reordering the strip */
export declare const useFontTopPicksDnD: ({ enabled, picks, onPicksChange, }: {
    enabled: boolean;
    picks: readonly FontFamilyValues[];
    onPicksChange: (picks: FontFamilyValues[]) => void;
}) => FontPickerDnD;
