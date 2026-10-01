import type { NonDeletedExcalidrawElement } from "../../../element/src/types";
import type { Scene } from "../../../element/src/index";
import type { AppState } from "../../types";
interface AngleProps {
    element: NonDeletedExcalidrawElement;
    scene: Scene;
    appState: AppState;
    property: "angle";
}
declare const Angle: ({ element, scene, appState, property }: AngleProps) => import("react/jsx-runtime").JSX.Element;
export default Angle;
