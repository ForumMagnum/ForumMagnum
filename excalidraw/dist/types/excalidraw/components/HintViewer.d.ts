import type { EditorInterface } from "../../common/src/index";
import "./HintViewer.scss";
import type { AppClassProperties, UIAppState } from "../types";
interface HintViewerProps {
    appState: UIAppState;
    isMobile: boolean;
    editorInterface: EditorInterface;
    app: AppClassProperties;
}
export declare const HintViewer: ({ appState, isMobile, editorInterface, app, }: HintViewerProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
