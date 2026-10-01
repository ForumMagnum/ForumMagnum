import { type FontMetadata } from "../../common/src/index";
import type { ExcalidrawElement } from "../../element/src/types";
import type { Scene } from "../../element/src/index";
import { ExcalidrawFontFace } from "./ExcalidrawFontFace";
export declare class Fonts {
    static readonly loadedFontsCache: Set<string>;
    private static _registered;
    private static _initialized;
    static get registered(): Map<number, {
        metadata: FontMetadata;
        fontFaces: ExcalidrawFontFace[];
    }>;
    get registered(): Map<number, {
        metadata: FontMetadata;
        fontFaces: ExcalidrawFontFace[];
    }>;
    private readonly scene;
    private readonly ownerDocument;
    constructor(scene: Scene, ownerDocument?: Document);
    /**
     * Get all the font families for the given scene.
     */
    getSceneFamilies: () => number[];
    /**
     * if we load a (new) font, it's likely that text elements using it have
     * already been rendered using a fallback font. Thus, we want invalidate
     * their shapes and rerender. See #637.
     *
     * Invalidates text elements and rerenders scene, provided that at least one
     * of the supplied fontFaces has not already been processed.
     */
    onLoaded: (fontFaces: readonly FontFace[]) => void;
    /**
     * Load font faces for a given scene and trigger scene update.
     */
    loadSceneFonts: () => Promise<FontFace[]>;
    /**
     * Load font faces for passed elements - use when the scene is unavailable (i.e. export).
     */
    static loadElementsFonts: (elements: readonly ExcalidrawElement[], ownerDocument?: Document) => Promise<FontFace[]>;
    /**
     * Generate CSS @font-face declarations for the given elements.
     */
    static generateFontFaceDeclarations(elements: readonly ExcalidrawElement[]): Promise<string[]>;
    private static loadFontFaces;
    private static fontFacesLoader;
    private static fontFacesStylesGenerator;
    /**
     * Register a new font.
     *
     * @param family font family
     * @param metadata font metadata
     * @param fontFacesDecriptors font faces descriptors
     */
    private static register;
    /**
     * WARN: should be called just once on init, even across multiple instances.
     */
    private static init;
    /**
     * Get all the unique font families for the given elements.
     */
    private static getUniqueFamilies;
    /**
     * Get all the unique characters per font family for the given scene.
     */
    private static getCharsPerFamily;
    /**
     * Get characters for a given family.
     */
    private static getCharacters;
    /**
     * Get all registered font families.
     */
    private static getAllFamilies;
}
export interface ExcalidrawFontFaceDescriptor {
    uri: string;
    descriptors?: FontFaceDescriptors;
}
