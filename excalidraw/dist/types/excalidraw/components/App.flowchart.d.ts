import type React from "react";
import type App from "./App";
import type { PendingExcalidrawElements } from "../types";
/**
 * Captures the App state management for the flowchart functionality.
 */
export declare class AppFlowchart {
    private app;
    private creator;
    private navigator;
    constructor(app: App);
    get pendingNodes(): PendingExcalidrawElements | null;
    get isCreatingChart(): boolean;
    /** ends any in-progress flowchart creation/navigation session */
    clear: () => void;
    handleKeyEvent: (event: React.KeyboardEvent | KeyboardEvent) => boolean;
    private resolveKeyboardEventToOperation;
    private selectAndReveal;
    private captureUpdate;
    private static getLinkDirectionFromKey;
}
