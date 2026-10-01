import React from "react";
import "./ToolPopover.scss";
import type { AppClassProperties } from "../types";
type ToolOption = {
    type: string;
    icon: React.ReactNode;
    title: string;
    fillable?: boolean;
};
type ToolPopoverProps = {
    app: AppClassProperties;
    options: readonly ToolOption[];
    activeTool: {
        type: string;
    };
    defaultOption: string;
    "data-testid": string;
    onToolChange: (type: string) => void;
    displayedOption: ToolOption;
};
export declare const ToolPopover: ({ app, options, activeTool, defaultOption, "data-testid": dataTestId, onToolChange, displayedOption, }: ToolPopoverProps) => import("react/jsx-runtime").JSX.Element;
export {};
