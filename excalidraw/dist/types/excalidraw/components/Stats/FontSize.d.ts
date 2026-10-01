import type { ExcalidrawElement } from "../../../element/src/types";
import type { Scene } from "../../../element/src/index";
import type { AppState } from "../../types";
interface FontSizeProps {
    element: ExcalidrawElement;
    scene: Scene;
    appState: AppState;
    property: "fontSize";
}
declare const FontSize: ({ element, scene, appState, property }: FontSizeProps) => import("react/jsx-runtime").JSX.Element | null;
export default FontSize;
