import type { Theme } from "../../../element/src/types";
interface CustomColorListProps {
    theme: Theme;
    colors: string[];
    color: string | null;
    onChange: (color: string) => void;
    label: string;
}
export declare const CustomColorList: ({ theme, colors, color, onChange, label, }: CustomColorListProps) => import("react/jsx-runtime").JSX.Element;
export {};
