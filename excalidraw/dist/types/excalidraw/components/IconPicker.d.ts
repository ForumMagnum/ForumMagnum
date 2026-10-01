import "./IconPicker.scss";
import type { JSX } from "react";
type Option<T> = {
    value: T;
    text: string;
    icon: JSX.Element;
    keyBinding: string | null;
};
type PickerSection<T> = {
    name: string;
    options: readonly Option<T>[];
};
export declare function IconPicker<T>({ value, label, visibleSections, hiddenSections, onChange, }: {
    label: string;
    value: T;
    visibleSections: readonly PickerSection<T>[];
    hiddenSections?: readonly PickerSection<T>[];
    onChange: (value: T) => void;
}): import("react/jsx-runtime").JSX.Element;
export {};
