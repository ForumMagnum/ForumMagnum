import type { NonDeletedExcalidrawElement } from "../../element/src/types";
import type { Scene } from "../../element/src/index";
import type { RenderableElementsMap } from "./types";
import type { AppState, ElementRenderOffsets } from "../types";
type GetRenderableElementsOpts = {
    zoom: AppState["zoom"];
    offsetLeft: AppState["offsetLeft"];
    offsetTop: AppState["offsetTop"];
    scrollX: AppState["scrollX"];
    scrollY: AppState["scrollY"];
    height: AppState["height"];
    width: AppState["width"];
    editingTextElement: AppState["editingTextElement"];
    newElement: AppState["newElement"];
    selectedElements: readonly NonDeletedExcalidrawElement[];
    selectedElementsAreBeingDragged: AppState["selectedElementsAreBeingDragged"];
    frameToHighlight: AppState["frameToHighlight"];
};
export declare class Renderer {
    private scene;
    constructor(scene: Scene);
    /**
     * Adjusts the document-visible set for render-override translations: an
     * element leaves it when its offset moves it out of view and enters it when
     * its offset brings it in; everything else keeps its document visibility.
     * Only translated elements go through viewport geometry. The result is
     * memoized on the offsets' identity so that opacity-only snapshots don't
     * reach it at all.
     */
    getVisibleElementsWithRenderOffsets(visibleElements: readonly NonDeletedExcalidrawElement[], elementsMap: RenderableElementsMap, appState: AppState, offsets: ElementRenderOffsets): readonly NonDeletedExcalidrawElement[];
    private _getVisibleElementsWithRenderOffsets;
    /** the document-visible elements as a set, cached per visible array */
    private visibleSets;
    private getVisibleSet;
    private getVisibleCanvasElements;
    private getRenderableElementsMap;
    private sortSelectedElementsIntoHighlightedFrame;
    private _getRenderableElements;
    getRenderableElements: (opts: GetRenderableElementsOpts) => {
        elementsMap: RenderableElementsMap;
        visibleElements: readonly NonDeletedExcalidrawElement[];
        newElementCanvasElement: (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "line" | "arrow";
            points: readonly import("../../math/src/index").LocalPoint[];
            startBinding: import("../../element/src/types").FixedPointBinding | null;
            endBinding: import("../../element/src/types").FixedPointBinding | null;
            startArrowhead: import("../../element/src/types").Arrowhead | null;
            endArrowhead: import("../../element/src/types").Arrowhead | null;
        }> & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "rectangle";
        } & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "stickynote";
            baseHeight: number;
        }> & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "diamond";
        } & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "ellipse";
        } & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "embeddable";
        }> & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "iframe";
            customData?: {
                generationData?: import("../../element/src/types").MagicGenerationData;
            };
        }> & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "image";
            fileId: import("../../element/src/types").FileId | null;
            status: "pending" | "saved" | "error";
            scale: [number, number];
            crop: import("../../element/src/types").ImageCrop | null;
        }> & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "frame";
            name: string | null;
        } & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "magicframe";
            name: string | null;
        } & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "text";
            fontSize: number;
            fontFamily: import("../../element/src/types").FontFamilyValues;
            baseFontSize: number | null;
            text: string;
            textAlign: import("../../element/src/types").TextAlign;
            verticalAlign: import("../../element/src/types").VerticalAlign;
            containerId: import("../../element/src/types").ExcalidrawTextContainer["id"] | null;
            originalText: string;
            autoResize: boolean;
            lineHeight: number & {
                _brand: "unitlessLineHeight";
            };
            labelPosition?: number | null;
        }> & {
            isDeleted: false;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "freedraw";
            points: readonly import("../../math/src/index").LocalPoint[];
            pressures: readonly number[];
            simulatePressure: boolean;
            strokeOptions: import("../../element/src/types").StrokeOptions;
        }> & {
            isDeleted: false;
        }) | null;
        canvasNonce: string;
    };
    destroy(): void;
}
export {};
