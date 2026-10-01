import type { NonDeletedExcalidrawElement } from "../../../element/src/types";
import type { Scene } from "../../../element/src/index";
import type { AppState } from "../../types";
interface MultiAngleProps {
    elements: readonly NonDeletedExcalidrawElement[];
    scene: Scene;
    appState: AppState;
    property: "angle";
}
declare const MultiAngle: ({ elements, scene, appState, property, }: MultiAngleProps) => import("react/jsx-runtime").JSX.Element;
export default MultiAngle;
