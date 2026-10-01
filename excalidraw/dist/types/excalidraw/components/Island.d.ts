import React from "react";
import "./Island.scss";
import type { ViewportUIDock, ViewportUIName } from "../types";
type IslandProps = {
    children: React.ReactNode;
    padding?: number;
    className?: string | boolean;
    style?: object;
    /** marks the island as a canvas-occluding UI surface measured by
     * `getViewportOffsets` (see {@link ViewportUIDock}) */
    "data-viewport-ui"?: ViewportUIDock;
    /** identifies the surface so `getViewportOffsets` can reserve space for
     * it while hidden (see {@link ViewportUIName}) */
    "data-viewport-ui-name"?: ViewportUIName;
};
export declare const Island: React.ForwardRefExoticComponent<IslandProps & React.RefAttributes<HTMLDivElement>>;
export {};
