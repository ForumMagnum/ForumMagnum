import React from "react";
import type { ExcalidrawElement, Theme } from "../../../element/src/types";
import type { ColorPaletteCustom } from "../../../common/src/index";
import type { ColorPickerType } from "./colorPickerUtils";
interface PickerProps {
    theme: Theme;
    color: string | null;
    onChange: (color: string) => void;
    type: ColorPickerType;
    elements: readonly ExcalidrawElement[];
    palette: ColorPaletteCustom;
    updateData: (formData?: any) => void;
    children?: React.ReactNode;
    showTitle?: boolean;
    onEyeDropperToggle: (force?: boolean) => void;
    onEscape: (event: React.KeyboardEvent | KeyboardEvent) => void;
    showHotKey?: boolean;
    excludedColors?: readonly string[];
    /** present only while the top picks are customized */
    onResetTopPicks?: () => void;
}
export declare const Picker: React.ForwardRefExoticComponent<PickerProps & React.RefAttributes<unknown>>;
export {};
