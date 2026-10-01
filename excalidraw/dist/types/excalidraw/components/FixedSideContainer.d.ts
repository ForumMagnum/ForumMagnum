import React from "react";
import "./FixedSideContainer.scss";
type FixedSideContainerProps = {
    children: React.ReactNode;
    side: "top" | "left" | "right";
    className?: string;
};
export declare const FixedSideContainer: ({ children, side, className, }: FixedSideContainerProps) => import("react/jsx-runtime").JSX.Element;
export {};
