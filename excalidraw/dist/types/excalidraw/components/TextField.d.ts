import "./TextField.scss";
import type { KeyboardEvent } from "react";
type TextFieldProps = {
    onChange?: (value: string) => void;
    onClick?: () => void;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
    readonly?: boolean;
    fullWidth?: boolean;
    selectOnRender?: boolean;
    icon?: React.ReactNode;
    label?: string;
    className?: string;
    placeholder?: string;
    isRedacted?: boolean;
    type?: "text" | "search";
} & ({
    value: string;
} | {
    defaultValue: string;
});
export declare const TextField: import("react").ForwardRefExoticComponent<TextFieldProps & import("react").RefAttributes<HTMLInputElement>>;
export {};
