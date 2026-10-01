import React from "react";
import type { NonDeletedExcalidrawElement } from "../../element/src/types";
import "./ExportDialog.scss";
import type { ActionManager } from "../actions/manager";
import type { ExportOpts, BinaryFiles, UIAppState } from "../types";
export type ExportCB = (elements: readonly NonDeletedExcalidrawElement[], scale?: number) => void;
export declare const JSONExportDialog: ({ elements, appState, files, actionManager, exportOpts, canvas, setAppState, }: {
    elements: readonly NonDeletedExcalidrawElement[];
    appState: UIAppState;
    files: BinaryFiles;
    actionManager: ActionManager;
    exportOpts: ExportOpts;
    canvas: HTMLCanvasElement;
    setAppState: React.Component<any, UIAppState>["setState"];
}) => import("react/jsx-runtime").JSX.Element;
