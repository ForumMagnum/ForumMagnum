import type { TransformHandleType } from "./transformHandles";
import type { ElementsMap, ExcalidrawImageElement, ImageCrop } from "./types";
export declare const MINIMAL_CROP_SIZE = 10;
export declare const cropElement: (element: ExcalidrawImageElement, elementsMap: ElementsMap, transformHandle: TransformHandleType, naturalWidth: number, naturalHeight: number, pointerX: number, pointerY: number, widthAspectRatio?: number) => {
    x: number;
    y: number;
    width: number;
    height: number;
    crop: ImageCrop | null;
};
export declare const getUncroppedImageElement: (element: ExcalidrawImageElement, elementsMap: ElementsMap) => ExcalidrawImageElement;
export declare const getUncroppedWidthAndHeight: (element: ExcalidrawImageElement) => {
    width: number;
    height: number;
};
export declare const getFlipAdjustedCropPosition: (element: ExcalidrawImageElement, natural?: boolean) => {
    x: number;
    y: number;
} | null;
