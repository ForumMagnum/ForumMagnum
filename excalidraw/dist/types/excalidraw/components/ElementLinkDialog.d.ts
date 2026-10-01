import type { ExcalidrawElement } from "../../element/src/types";
import type { Scene } from "../../element/src/index";
import "./ElementLinkDialog.scss";
import type { AppProps, UIAppState } from "../types";
declare const ElementLinkDialog: ({ sourceElementId, onClose, appState, scene, generateLinkForSelection, }: {
    sourceElementId: ExcalidrawElement["id"];
    appState: UIAppState;
    scene: Scene;
    onClose?: () => void;
    generateLinkForSelection: AppProps["generateLinkForSelection"];
}) => import("react/jsx-runtime").JSX.Element;
export default ElementLinkDialog;
