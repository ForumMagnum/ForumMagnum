import type { ColorTuple, ColorPaletteCustom } from "../../../common/src/index";
import type { ExcalidrawElement } from "../../../element/src/types";
import "./ColorPicker.scss";
import type { ColorPickerType } from "./colorPickerUtils";
import type { AppState, UIAppState } from "../../types";
interface ColorPickerProps {
    type: ColorPickerType;
    /**
     * null indicates no color should be displayed as active
     * (e.g. when multiple shapes selected with different colors)
     */
    color: string | null;
    onChange: (color: string) => void;
    label: string;
    elements: readonly ExcalidrawElement[];
    appState: UIAppState;
    palette?: ColorPaletteCustom | null;
    topPicks?: ColorTuple;
    updateData: (formData?: any) => void;
    /** palette colors to hide from the popup, keeping hotkey positions */
    excludedColors?: readonly string[];
    /** allow users to customize the top picks strip by drag & dropping colors
     * from the picker popup onto it. The value names the
     * `appState.colorTopPicks` slot the customization is stored in */
    customizableTopPicks?: keyof AppState["colorTopPicks"];
}
export declare const ColorPicker: import("react").MemoExoticComponent<({ type, color, onChange, label, elements, palette, topPicks, updateData, appState, excludedColors, customizableTopPicks, }: ColorPickerProps) => import("react/jsx-runtime").JSX.Element>;
export {};
