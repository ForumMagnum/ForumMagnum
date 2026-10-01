import type { NonDeletedExcalidrawElement, NonDeletedSceneElementsMap } from "../../../element/src/types";
import type { Scene } from "../../../element/src/index";
import type { AtomicUnit } from "./utils";
import type { AppState } from "../../types";
interface MultiDimensionProps {
    property: "width" | "height";
    elements: readonly NonDeletedExcalidrawElement[];
    elementsMap: NonDeletedSceneElementsMap;
    atomicUnits: AtomicUnit[];
    scene: Scene;
    appState: AppState;
}
declare const MultiDimension: ({ property, elements, elementsMap, atomicUnits, scene, appState, }: MultiDimensionProps) => import("react/jsx-runtime").JSX.Element;
export default MultiDimension;
