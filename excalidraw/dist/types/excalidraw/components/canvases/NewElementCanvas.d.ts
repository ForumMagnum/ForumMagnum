import type { NonDeletedSceneElementsMap } from "../../../element/src/types";
import type { RenderableElementsMap, StaticCanvasRenderConfig } from "../../scene/types";
import type { AppState } from "../../types";
import type { RoughCanvas } from "roughjs/bin/canvas";
interface NewElementCanvasProps {
    appState: AppState;
    newElement: NonNullable<AppState["newElement"]>;
    elementsMap: RenderableElementsMap;
    allElementsMap: NonDeletedSceneElementsMap;
    scale: number;
    rc: RoughCanvas;
    renderConfig: StaticCanvasRenderConfig;
    /** CSS opacity of the whole canvas — a translucent preview of a finished element */
    opacity?: number;
}
declare const NewElementCanvas: (props: NewElementCanvasProps) => import("react/jsx-runtime").JSX.Element;
export default NewElementCanvas;
