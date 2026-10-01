import React from "react";
import { applyDarkModeFilter, getStrokeWidthByKey } from "../common/src/index";
import Footer from "./components/footer/FooterCenter";
import LiveCollaborationTrigger from "./components/live-collaboration/LiveCollaborationTrigger";
import MainMenu from "./components/main-menu/MainMenu";
import WelcomeScreen from "./components/welcome-screen/WelcomeScreen";
import { useOnAppStateChange as _useOnAppStateChange } from "./hooks/useAppStateValue";
import "./css/app.scss";
import "./css/styles.scss";
import "./fonts/fonts.css";
import type { AppState, ExcalidrawProps } from "./types";
/**
 * Stateless provider that allows `useExcalidrawAPI()` (and hooks built
 * on it, such as `useAppStateValue()` and `useOnAppStateChange()`) to work
 * outside the <Excalidraw> component tree.
 */
export declare const ExcalidrawAPIProvider: ({ children, }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const Excalidraw: React.MemoExoticComponent<(props: ExcalidrawProps) => import("react/jsx-runtime").JSX.Element>;
export { getSceneVersion, hashElementsVersion, hashString, getNonDeletedElements, } from "../element/src/index";
export { getTextFromElements } from "../element/src/index";
export { isInvisiblySmallElement } from "../element/src/index";
export { defaultLang, useI18n, languages } from "./i18n";
export { restoreAppState, restoreElement, restoreElements, restoreLibraryItems, } from "./data/restore";
export { reconcileElements } from "./data/reconcile";
export { exportToCanvas, exportToBlob, exportToSvg, exportToClipboard, } from "../utils/src/export";
export { serializeAsJSON, serializeLibraryAsJSON } from "./data/json";
export { loadFromBlob, loadSceneOrLibraryFromBlob, loadLibraryFromBlob, } from "./data/blob";
export { mergeLibraryItems, getLibraryItemsHash } from "./data/library";
export { isLinearElement } from "../element/src/index";
export { FONT_FAMILY, THEME, MIME_TYPES, ROUNDNESS, DEFAULT_LASER_COLOR, UserIdleState, normalizeLink, sceneCoordsToViewportCoords, viewportCoordsToSceneCoords, getFormFactor, throttleRAF, } from "../common/src/index";
export { mutateElement, newElementWith, bumpVersion, } from "../element/src/index";
export { CaptureUpdateAction } from "../element/src/index";
export { parseLibraryTokensFromUrl, useHandleLibrary } from "./data/library";
export { Sidebar } from "./components/Sidebar/Sidebar";
export { Button } from "./components/Button";
export { Footer };
export { MainMenu };
export { Ellipsify } from "./components/Ellipsify";
export { useEditorInterface, useStylesPanelMode, useExcalidrawAPI, ExcalidrawAPIContext, } from "./components/App";
export { WelcomeScreen };
export { LiveCollaborationTrigger };
export { Stats } from "./components/Stats";
export { DefaultSidebar } from "./components/DefaultSidebar";
export { TTDDialog } from "./components/TTDDialog/TTDDialog";
export { TTDDialogTrigger } from "./components/TTDDialog/TTDDialogTrigger";
export { TTDStreamFetch, parseSSEStream, } from "./components/TTDDialog/utils/TTDStreamFetch";
export type { StreamChunk } from "./components/TTDDialog/utils/TTDStreamFetch";
export type { TTDPersistenceAdapter, SavedChat, SavedChats, } from "./components/TTDDialog/types";
export type { ViewportStatusFrame, ElementRenderOverride, ElementRenderOverrides, } from "./types";
export { zoomToFitBounds, DEFAULT_OVERSCROLL } from "./viewport";
export { getCommonBounds, getVisibleSceneBounds, convertToExcalidrawElements, } from "../element/src/index";
export { elementsOverlappingBBox } from "../element/src/index";
export { DiagramToCodePlugin } from "./components/DiagramToCodePlugin/DiagramToCodePlugin";
export { getDataURL } from "./data/blob";
export { isElementLink } from "../element/src/index";
export { Fonts } from "./fonts/Fonts";
export { setCustomTextMetricsProvider } from "../element/src/index";
export { CommandPalette } from "./components/CommandPalette/CommandPalette";
export { renderSpreadsheet, tryParseSpreadsheet, isSpreadsheetValidForChartType, } from "./charts";
/**
 * hook that subscribes to specific appState prop(s)
 *
 * @param prop - appState prop(s) to subscribe to, or a selector function.
 * NOTE `prop/selector` is memoized and will not change after initial render
 */
export declare function useExcalidrawStateValue<K extends keyof AppState>(prop: K): AppState[K] | undefined;
export declare function useExcalidrawStateValue<T extends keyof AppState>(props: T[]): AppState | undefined;
export declare function useExcalidrawStateValue<T>(selector: (appState: AppState) => T): T | undefined;
export { _useOnAppStateChange as useOnExcalidrawStateChange };
export { applyDarkModeFilter, getStrokeWidthByKey };
