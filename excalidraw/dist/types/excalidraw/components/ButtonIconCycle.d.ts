import type { JSX } from "react";
export declare const ButtonIconCycle: <T extends any>({ options, value, onChange, group, }: {
    options: {
        value: T;
        text: string;
        icon: JSX.Element;
    }[];
    value: T | null;
    onChange: (value: T) => void;
    group: string;
}) => import("react/jsx-runtime").JSX.Element;
