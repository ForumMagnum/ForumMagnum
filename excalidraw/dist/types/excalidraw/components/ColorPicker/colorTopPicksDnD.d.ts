import type { TopPicksDnD } from "../TopPicksDnD/topPicksDnD";
export type ColorPickerDnD = TopPicksDnD<string>;
export declare const ColorPickerDnDContext: import("react").Context<ColorPickerDnD | null>;
export declare const useColorPickerDnD: () => ColorPickerDnD | null;
/** pinning colors from the picker popup (palette/shades/custom) or the
 * active-color trigger to the top-picks strip, and reordering the strip */
export declare const useColorTopPicksDnD: ({ enabled, picks, onPicksChange, }: {
    enabled: boolean;
    picks: readonly string[];
    onPicksChange: (picks: string[]) => void;
}) => ColorPickerDnD;
