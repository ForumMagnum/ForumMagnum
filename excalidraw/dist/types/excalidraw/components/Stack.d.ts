import React from "react";
import "./Stack.scss";
type StackProps = {
    children: React.ReactNode;
    gap?: number;
    align?: "start" | "center" | "end" | "baseline";
    justifyContent?: "center" | "space-around" | "space-between";
    className?: string | boolean;
    style?: React.CSSProperties;
};
declare const _default: {
    Row: React.ForwardRefExoticComponent<StackProps & React.RefAttributes<HTMLDivElement>>;
    Col: React.ForwardRefExoticComponent<StackProps & React.RefAttributes<HTMLDivElement>>;
};
export default _default;
