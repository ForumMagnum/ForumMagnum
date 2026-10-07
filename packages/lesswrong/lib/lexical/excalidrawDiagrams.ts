/**
 * Shared constants for Excalidraw diagrams embedded in Lexical documents.
 *
 * A diagram is exported to HTML as
 *   <figure class="excalidraw-diagram" data-excalidraw-scene="...">
 *     <svg>...</svg>
 *   </figure>
 * where the SVG is a static rendering of the diagram (shown to readers), and
 * the data attribute holds the Excalidraw scene JSON (used to make the diagram
 * editable again). The data attribute is removed by the sanitizer, so it's
 * present in a revision's originalContents but not in the HTML served to
 * readers.
 */
export const EXCALIDRAW_DIAGRAM_CLASS = 'excalidraw-diagram';

/** Added (alongside an inline width style) when the user has resized a diagram. */
export const EXCALIDRAW_DIAGRAM_RESIZED_CLASS = 'excalidraw-diagram_resized';

export const EXCALIDRAW_SCENE_ATTRIBUTE = 'data-excalidraw-scene';

/**
 * Value for `window.EXCALIDRAW_ASSET_PATH`. Excalidraw's font URLs are
 * absolute paths (under /excalidraw-assets/, see excalidraw/build.mjs), which
 * it resolves relative to this.
 */
export const EXCALIDRAW_ASSET_PATH = '/';

/**
 * The CSS filter Excalidraw uses to render diagrams in dark mode. We store
 * diagrams in light mode, and apply this filter when displaying them on a
 * dark theme.
 */
export const EXCALIDRAW_DARK_MODE_FILTER = 'invert(93%) hue-rotate(180deg)';
