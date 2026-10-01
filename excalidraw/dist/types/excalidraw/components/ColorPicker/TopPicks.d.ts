import type { Theme } from "../../../element/src/types";
import type { ColorPickerType } from "./colorPickerUtils";
interface TopPicksProps {
    theme: Theme;
    onChange: (color: string) => void;
    type: ColorPickerType;
    activeColor: string | null;
    topPicks?: readonly string[];
    /** present when the strip is user-customizable — enables the right-click
     * context menu resetting the strip to its default picks */
    onReset?: () => void;
    /** whether custom picks are currently applied (enables the reset item) */
    isCustomized?: boolean;
}
export declare const TopPicks: ({ theme, onChange, type, activeColor, topPicks, onReset, isCustomized, }: TopPicksProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
