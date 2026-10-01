import { type ColorPaletteCustom } from "../../../common/src/index";
import type { Theme } from "../../../element/src/types";
interface PickerColorListProps {
    theme: Theme;
    palette: ColorPaletteCustom;
    color: string | null;
    onChange: (color: string) => void;
    activeShade: number;
    showHotKey?: boolean;
    /**
     * palette colors to hide. Hidden entries keep their position in the hotkey
     * order (their hotkey goes dead instead of remapping the colors after them).
     */
    excludedColors?: readonly string[];
}
declare const PickerColorList: ({ theme, palette, color, onChange, activeShade, showHotKey, excludedColors, }: PickerColorListProps) => import("react/jsx-runtime").JSX.Element;
export default PickerColorList;
