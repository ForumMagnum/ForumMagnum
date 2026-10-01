import type { ExcalidrawElement, NonDeletedSceneElementsMap } from "../../../element/src/types";
import type { Scene } from "../../../element/src/index";
import type { AppState } from "../../types";
interface MultiFontSizeProps {
    elements: readonly ExcalidrawElement[];
    scene: Scene;
    elementsMap: NonDeletedSceneElementsMap;
    appState: AppState;
    property: "fontSize";
}
declare const MultiFontSize: ({ elements, scene, appState, property, elementsMap, }: MultiFontSizeProps) => import("react/jsx-runtime").JSX.Element | null;
export default MultiFontSize;
