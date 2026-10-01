import type { ExcalidrawElement } from "./types";
export declare const positionElementsOnGrid: <TElement extends ExcalidrawElement>(elements: TElement[] | TElement[][], centerX: number, centerY: number, padding?: number) => TElement[];
