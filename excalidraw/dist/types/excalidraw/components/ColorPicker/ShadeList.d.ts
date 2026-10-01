import { type ColorPaletteCustom } from "../../../common/src/index";
import type { Theme } from "../../../element/src/types";
interface ShadeListProps {
    theme: Theme;
    color: string | null;
    onChange: (color: string) => void;
    palette: ColorPaletteCustom;
    showHotKey?: boolean;
}
export declare const ShadeList: ({ theme, color, onChange, palette, showHotKey, }: ShadeListProps) => import("react/jsx-runtime").JSX.Element;
export {};
