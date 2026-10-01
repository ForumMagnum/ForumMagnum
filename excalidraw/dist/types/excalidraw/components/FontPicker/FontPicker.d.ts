import React from "react";
import type { FontFamilyValues } from "../../../element/src/types";
import "./FontPicker.scss";
export declare const DEFAULT_FONTS: {
    value: number;
    icon: import("react/jsx-runtime").JSX.Element;
    text: string;
    testId: string;
}[];
export declare const isDefaultFont: (fontFamily: number | null) => boolean;
interface FontPickerProps {
    isOpened: boolean;
    selectedFontFamily: FontFamilyValues | null;
    hoveredFontFamily: FontFamilyValues | null;
    /** user-customized top picks (`appState.fontTopPicks`) */
    topPicks: readonly FontFamilyValues[] | null;
    onSelect: (fontFamily: FontFamilyValues) => void;
    onTopPicksChange: (fontTopPicks: FontFamilyValues[] | null) => void;
    onHover: (fontFamily: FontFamilyValues) => void;
    onLeave: () => void;
    onPopupChange: (open: boolean) => void;
    compactMode?: boolean;
}
export declare const FontPicker: React.MemoExoticComponent<({ isOpened, selectedFontFamily, hoveredFontFamily, topPicks, onSelect, onTopPicksChange, onHover, onLeave, onPopupChange, compactMode, }: FontPickerProps) => import("react/jsx-runtime").JSX.Element>;
export {};
