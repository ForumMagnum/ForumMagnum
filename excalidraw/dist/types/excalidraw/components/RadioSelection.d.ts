import type { JSX } from "react";
export declare const RadioSelection: <T extends Object>(props: {
    options: {
        value: T;
        text: string;
        icon: JSX.Element;
        testId?: string;
        /** if not supplied, defaults to value identity check */
        active?: boolean;
    }[];
    value: T | null;
    type?: "radio" | "button";
} & ({
    type?: "radio";
    group: string;
    onChange: (value: T) => void;
} | {
    type: "button";
    onClick: (value: T, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
})) => import("react/jsx-runtime").JSX.Element;
