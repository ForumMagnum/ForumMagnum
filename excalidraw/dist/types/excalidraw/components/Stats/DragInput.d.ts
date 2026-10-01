import type { ElementsMap, ExcalidrawElement, NonDeletedExcalidrawElement } from "../../../element/src/types";
import type { Scene } from "../../../element/src/index";
import { useApp, useExcalidrawSetAppState } from "../App";
import "./DragInput.scss";
import type { StatsInputProperty } from "./utils";
import type { AppState } from "../../types";
export type DragInputCallbackType<P extends StatsInputProperty, E = NonDeletedExcalidrawElement> = (props: {
    accumulatedChange: number;
    instantChange: number;
    originalElements: readonly E[];
    originalElementsMap: ElementsMap;
    shouldKeepAspectRatio: boolean;
    shouldChangeByStepSize: boolean;
    scene: Scene;
    nextValue?: number;
    property: P;
    originalAppState: AppState;
    setInputValue: (value: number) => void;
    app: ReturnType<typeof useApp>;
    setAppState: ReturnType<typeof useExcalidrawSetAppState>;
}) => void;
export type DragFinishedCallbackType<E = ExcalidrawElement> = (props: {
    app: ReturnType<typeof useApp>;
    setAppState: ReturnType<typeof useExcalidrawSetAppState>;
    originalElements: readonly E[] | null;
    originalAppState: AppState;
}) => void;
interface StatsDragInputProps<T extends StatsInputProperty, E = ExcalidrawElement> {
    label: string | React.ReactNode;
    icon?: React.ReactNode;
    value: number | "Mixed";
    elements: readonly E[];
    editable?: boolean;
    shouldKeepAspectRatio?: boolean;
    dragInputCallback: DragInputCallbackType<T, E>;
    property: T;
    scene: Scene;
    appState: AppState;
    /** how many px you need to drag to get 1 unit change */
    sensitivity?: number;
    dragFinishedCallback?: DragFinishedCallbackType;
}
declare const StatsDragInput: <T extends StatsInputProperty, E extends ExcalidrawElement = ExcalidrawElement>({ label, icon, dragInputCallback, value, elements, editable, shouldKeepAspectRatio, property, scene, appState, sensitivity, dragFinishedCallback, }: StatsDragInputProps<T, E>) => import("react/jsx-runtime").JSX.Element | null;
export default StatsDragInput;
