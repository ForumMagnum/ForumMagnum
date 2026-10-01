import React from "react";
import "./Popover.scss";
type Props = {
    top?: number;
    left?: number;
    children?: React.ReactNode;
    onCloseRequest?(event: PointerEvent): void;
    fitInViewport?: boolean;
    viewportWidth?: number;
    viewportHeight?: number;
    className?: string;
};
export declare const Popover: ({ children, left, top, onCloseRequest, fitInViewport, viewportWidth, viewportHeight, className, }: Props) => import("react/jsx-runtime").JSX.Element;
export {};
