import type { ExcalidrawTextElement } from "../../element/src/types";
import type App from "../components/App";
/**
 * How much further than the browser's caret reveal the canvas pans, in
 * screen px: text typed past the viewport's edge comes back with this much
 * room to spare, instead of flush against the edge.
 */
export declare const CARET_FOLLOW_PADDING = 5;
type SubmitHandler = () => void;
export declare const textWysiwyg: ({ onChange, onSubmit, getViewportCoords, element, canvas, excalidrawContainer, app, autoSelect, initialCaretSceneCoords, }: {
    /**
     * textWysiwyg only deals with `originalText`
     *
     * Note: `text`, which can be wrapped and therefore different from `originalText`,
     *       is derived from `originalText`
     */
    onChange?: (nextOriginalText: string) => void;
    onSubmit: (data: {
        viaKeyboard: boolean;
        nextOriginalText: string;
    }) => void;
    getViewportCoords: (x: number, y: number) => [number, number];
    element: ExcalidrawTextElement;
    canvas: HTMLCanvasElement;
    excalidrawContainer: HTMLDivElement | null;
    app: App;
    autoSelect?: boolean;
    initialCaretSceneCoords?: {
        x: number;
        y: number;
    } | null;
}) => SubmitHandler;
export {};
