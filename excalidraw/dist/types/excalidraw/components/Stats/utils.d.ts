import type { ElementsMap, ExcalidrawElement, NonDeletedExcalidrawElement } from "../../../element/src/types";
import type { Scene } from "../../../element/src/index";
import type { AppState } from "../../types";
export type StatsInputProperty = "x" | "y" | "width" | "height" | "angle" | "fontSize" | "gridStep";
export declare const SMALLEST_DELTA = 0.01;
export declare const STEP_SIZE = 10;
export declare const isPropertyEditable: (element: ExcalidrawElement, property: keyof ExcalidrawElement) => boolean;
export declare const getStepSizedValue: (value: number, stepSize: number) => number;
export type AtomicUnit = Record<string, true>;
export declare const getElementsInAtomicUnit: (atomicUnit: AtomicUnit, elementsMap: ElementsMap, originalElementsMap?: ElementsMap) => {
    original: NonDeletedExcalidrawElement;
    latest: NonDeletedExcalidrawElement;
}[];
export declare const newOrigin: (x1: number, y1: number, w1: number, h1: number, w2: number, h2: number, angle: number) => {
    x: number;
    y: number;
};
export declare const moveElement: (newTopLeftX: number, newTopLeftY: number, originalElement: NonDeletedExcalidrawElement, scene: Scene, appState: AppState, originalElementsMap: ElementsMap, shouldInformMutation?: boolean) => void;
export declare const getAtomicUnits: (targetElements: readonly ExcalidrawElement[], appState: AppState) => AtomicUnit[];
