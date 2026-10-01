import type { FontFamilyValues } from "../../../element/src/types";
interface FontPickerTriggerProps {
    selectedFontFamily: FontFamilyValues | null;
    isOpened?: boolean;
    compactMode?: boolean;
}
export declare const FontPickerTrigger: ({ selectedFontFamily, isOpened, compactMode, }: FontPickerTriggerProps) => import("react/jsx-runtime").JSX.Element;
export {};
