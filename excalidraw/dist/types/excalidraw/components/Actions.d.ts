import type { NonDeletedElementsMap, NonDeletedSceneElementsMap } from "../../element/src/types";
import "./Actions.scss";
import type { AppClassProperties, UIAppState, AppState } from "../types";
import type { ActionManager } from "../actions/manager";
export { canChangeStrokeColor, canChangeBackgroundColor, } from "./shapeActionPredicates";
/**
 * Full styles panel: the wide, always-expanded layout used on desktop when the
 * UI is in "full" mode.
 */
export declare const SelectedShapeActions: ({ appState, elementsMap, renderAction, app, }: {
    appState: UIAppState;
    elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
    renderAction: ActionManager["renderAction"];
    app: AppClassProperties;
}) => import("react/jsx-runtime").JSX.Element;
/**
 * Compact styles panel — the collapsed, popover-driven layout used on tablets
 * and on desktop when the UI is in "compact" mode.
 */
export declare const CompactShapeActions: ({ appState, elementsMap, renderAction, app, setAppState, }: {
    appState: UIAppState;
    elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
    renderAction: ActionManager["renderAction"];
    app: AppClassProperties;
    setAppState: React.Component<any, AppState>["setState"];
}) => import("react/jsx-runtime").JSX.Element;
/**
 * Mobile styles panel — the horizontal action bar used on phones, with an
 * overflow measurement that promotes duplicate/delete out of the popover when
 * there is room.
 */
export declare const MobileShapeActions: ({ appState, elementsMap, renderAction, app, setAppState, }: {
    appState: UIAppState;
    elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
    renderAction: ActionManager["renderAction"];
    app: AppClassProperties;
    setAppState: React.Component<any, AppState>["setState"];
}) => import("react/jsx-runtime").JSX.Element;
export declare const ZoomActions: ({ renderAction, }: {
    renderAction: ActionManager["renderAction"];
}) => import("react/jsx-runtime").JSX.Element;
export declare const UndoRedoActions: ({ renderAction, className, }: {
    renderAction: ActionManager["renderAction"];
    className?: string;
}) => import("react/jsx-runtime").JSX.Element;
export declare const ExitZenModeButton: ({ actionManager, showExitZenModeBtn, }: {
    actionManager: ActionManager;
    showExitZenModeBtn: boolean;
}) => import("react/jsx-runtime").JSX.Element;
export declare const ExitViewModeButton: ({ actionManager, }: {
    actionManager: ActionManager;
}) => import("react/jsx-runtime").JSX.Element;
