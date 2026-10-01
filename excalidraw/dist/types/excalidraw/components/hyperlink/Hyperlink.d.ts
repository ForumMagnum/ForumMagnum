import type { Scene } from "../../../element/src/index";
import type { ElementsMap, ExcalidrawEmbeddableElement, NonDeletedExcalidrawElement } from "../../../element/src/types";
import "./Hyperlink.scss";
import type { AppState, ExcalidrawProps, UIAppState } from "../../types";
export declare const Hyperlink: ({ element, scene, setAppState, onLinkOpen, setToast, updateEmbedValidationStatus, }: {
    element: NonDeletedExcalidrawElement;
    scene: Scene;
    setAppState: React.Component<any, AppState>["setState"];
    onLinkOpen: ExcalidrawProps["onLinkOpen"];
    setToast: (toast: {
        message: string;
        closable?: boolean;
        duration?: number;
    } | null) => void;
    updateEmbedValidationStatus: (element: ExcalidrawEmbeddableElement, status: boolean) => void;
}) => import("react/jsx-runtime").JSX.Element | null;
export declare const getContextMenuLabel: (elements: readonly NonDeletedExcalidrawElement[], appState: UIAppState) => "labels.link.editEmbed" | "labels.link.edit" | "labels.link.create";
export declare const showHyperlinkTooltip: (element: NonDeletedExcalidrawElement, appState: AppState, elementsMap: ElementsMap) => void;
export declare const hideHyperlinkToolip: () => void;
