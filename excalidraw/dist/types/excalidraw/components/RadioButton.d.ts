import type { JSX } from "react";
interface RadioButtonProps {
    icon: JSX.Element;
    title: string;
    className?: string;
    testId?: string;
    /** if not supplied, defaults to value identity check */
    active?: boolean;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    style?: React.CSSProperties;
}
export declare const RadioButton: import("react").ForwardRefExoticComponent<RadioButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
export {};
