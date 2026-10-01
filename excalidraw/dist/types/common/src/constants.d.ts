import type { ExcalidrawElement, FontFamilyValues } from "../../element/src/types";
import type { AppProps, AppState } from "../../excalidraw/types";
export { DEFAULT_STICKY_NOTE_BG } from "./colors";
export declare const supportsResizeObserver: boolean;
export declare const APP_NAME = "Excalidraw";
export declare const TEXT_AUTOWRAP_THRESHOLD = 36;
export declare const TEXT_VIEWPORT_PADDING = 20;
export declare const TEXT_MAX_WRAP_WIDTH = 800;
export declare const DRAGGING_THRESHOLD = 10;
export declare const MINIMUM_ARROW_SIZE = 20;
export declare const LINE_CONFIRM_THRESHOLD = 8;
export declare const ELEMENT_SHIFT_TRANSLATE_AMOUNT = 5;
export declare const ELEMENT_TRANSLATE_AMOUNT = 1;
export declare const TEXT_TO_CENTER_SNAP_THRESHOLD = 30;
export declare const SHIFT_LOCKING_ANGLE: number;
export declare const DEFAULT_LASER_COLOR = "red";
export declare const CURSOR_TYPE: {
    TEXT: string;
    CROSSHAIR: string;
    GRABBING: string;
    GRAB: string;
    POINTER: string;
    MOVE: string;
    AUTO: string;
};
export declare const POINTER_BUTTON: {
    readonly MAIN: 0;
    readonly WHEEL: 1;
    readonly SECONDARY: 2;
    readonly TOUCH: -1;
    readonly ERASER: 5;
};
export declare const POINTER_EVENTS: {
    readonly enabled: "all";
    readonly disabled: "none";
    readonly inheritFromUI: any;
};
export declare enum EVENT {
    COPY = "copy",
    PASTE = "paste",
    CUT = "cut",
    KEYDOWN = "keydown",
    KEYUP = "keyup",
    MOUSE_MOVE = "mousemove",
    RESIZE = "resize",
    UNLOAD = "unload",
    FOCUS = "focus",
    BLUR = "blur",
    DRAG_OVER = "dragover",
    DROP = "drop",
    GESTURE_END = "gestureend",
    BEFORE_UNLOAD = "beforeunload",
    GESTURE_START = "gesturestart",
    GESTURE_CHANGE = "gesturechange",
    POINTER_MOVE = "pointermove",
    POINTER_DOWN = "pointerdown",
    POINTER_UP = "pointerup",
    POINTER_CANCEL = "pointercancel",
    STATE_CHANGE = "statechange",
    WHEEL = "wheel",
    TOUCH_START = "touchstart",
    TOUCH_END = "touchend",
    HASHCHANGE = "hashchange",
    VISIBILITY_CHANGE = "visibilitychange",
    SCROLL = "scroll",
    EXCALIDRAW_LINK = "excalidraw-link",
    MENU_ITEM_SELECT = "menu.itemSelect",
    MESSAGE = "message",
    FULLSCREENCHANGE = "fullscreenchange"
}
export declare const YOUTUBE_STATES: {
    readonly UNSTARTED: -1;
    readonly ENDED: 0;
    readonly PLAYING: 1;
    readonly PAUSED: 2;
    readonly BUFFERING: 3;
    readonly CUED: 5;
};
export declare const ENV: {
    TEST: string;
    DEVELOPMENT: string;
    PRODUCTION: string;
};
export declare const CLASSES: {
    SIDEBAR: string;
    SHAPE_ACTIONS_MENU: string;
    ZOOM_ACTIONS: string;
    SEARCH_MENU_INPUT_WRAPPER: string;
    CONVERT_ELEMENT_TYPE_POPUP: string;
    SHAPE_ACTIONS_THEME_SCOPE: string;
    FRAME_NAME: string;
    DROPDOWN_MENU_EVENT_WRAPPER: string;
};
export declare const FONT_SIZES: {
    readonly sm: 16;
    readonly md: 20;
    readonly lg: 28;
    readonly xl: 36;
};
export declare const CJK_HAND_DRAWN_FALLBACK_FONT = "Xiaolai";
export declare const WINDOWS_EMOJI_FALLBACK_FONT = "Segoe UI Emoji";
/**
 * // TODO: shouldn't be really `const`, likely neither have integers as values, due to value for the custom fonts, which should likely be some hash.
 *
 * Let's think this through and consider:
 * - https://developer.mozilla.org/en-US/docs/Web/CSS/generic-family
 * - https://drafts.csswg.org/css-fonts-4/#font-family-prop
 * - https://learn.microsoft.com/en-us/typography/opentype/spec/ibmfc
 */
export declare const FONT_FAMILY: {
    Virgil: number;
    Helvetica: number;
    Cascadia: number;
    Excalifont: number;
    Nunito: number;
    "Lilita One": number;
    "Comic Shanns": number;
    "Liberation Sans": number;
    Assistant: number;
};
export declare const SANS_SERIF_GENERIC_FONT = "sans-serif";
export declare const MONOSPACE_GENERIC_FONT = "monospace";
export declare const FONT_FAMILY_GENERIC_FALLBACKS: {
    "sans-serif": number;
    monospace: number;
};
export declare const FONT_FAMILY_FALLBACKS: {
    "Segoe UI Emoji": number;
    "sans-serif": number;
    monospace: number;
    Xiaolai: number;
};
export declare function getGenericFontFamilyFallback(fontFamily: number): keyof typeof FONT_FAMILY_GENERIC_FALLBACKS;
export declare const getFontFamilyFallbacks: (fontFamily: number) => Array<keyof typeof FONT_FAMILY_FALLBACKS>;
export declare const THEME: {
    readonly LIGHT: "light";
    readonly DARK: "dark";
};
export declare const DARK_THEME_FILTER = "invert(93%) hue-rotate(180deg)";
export declare const FRAME_STYLE: {
    strokeColor: ExcalidrawElement["strokeColor"];
    strokeWidth: ExcalidrawElement["strokeWidth"];
    strokeStyle: ExcalidrawElement["strokeStyle"];
    fillStyle: ExcalidrawElement["fillStyle"];
    roughness: ExcalidrawElement["roughness"];
    roundness: ExcalidrawElement["roundness"];
    backgroundColor: ExcalidrawElement["backgroundColor"];
    radius: number;
    nameOffsetY: number;
    nameColorLightTheme: string;
    nameColorDarkTheme: string;
    nameFontSize: number;
    nameLineHeight: number;
};
export declare const MIN_FONT_SIZE = 1;
export declare const DEFAULT_FONT_SIZE = 20;
export declare const STICKY_NOTE_MIN_FONT_SIZE = 16;
export declare const STICKY_NOTE_MAX_FONT_SIZE = 512;
export declare const STICKY_NOTE_FALLBACK_FONT_SIZE = 28;
export declare const STICKY_NOTE_FONT_STEP = 2;
export declare const STICKY_NOTE_PADDING = 16;
/**
 * The creation-date footer: a 20px text row under the label body plus a 12px
 * gap above it, inside the note's bottom padding. Reserved for every note —
 * also when `created` is unknown — so geometry never depends on data
 * availability. The label is chosen by width bucket, never measured, so
 * painting stays measurement-free (the server has no text measurer):
 * `minBodyWidthForYear` is the worst case ("30 May 2026") in the system sans
 * stack at 12px, with margin for wider fallbacks such as DejaVu Sans.
 */
/**
 * The creation-date footer of a sticky note. The label body ends `height`
 * above the note's bottom padding, and the date's baseline sits
 * `baselineFromBottom` above the note's bottom edge — so the 12px glyphs
 * (~9px above the baseline, ~3px below) end up roughly 11px from the edge
 * with a ~13px gap to the label body above them.
 */
export declare const STICKY_NOTE_FOOTER: {
    readonly height: 20;
    readonly fontSize: 12;
    readonly fontFamily: "Helvetica, Arial, sans-serif";
    readonly baselineFromBottom: 14;
    readonly opacity: 1;
    readonly minBodyWidthForYear: 80;
};
/**
 * outer height → label body height: top + bottom padding + footer. The body
 * is what the label is fitted into; a middle-aligned label is still centered
 * in the whole padded note when it fits (see `computeBoundTextPosition`).
 */
export declare const STICKY_NOTE_BODY_INSET_Y: number;
export declare const DEFAULT_STICKY_NOTE_SIZE = 250;
export declare const STICKY_NOTE_MIN_SIZE = 75;
export declare const STICKY_NOTE_SHADOW_OFFSET = 3;
export declare const STICKY_NOTE_SHADOW_OPACITY = 0.16;
export declare const STICKY_NOTE_EDGE_SHADOW_WIDTH = 0.5;
export declare const STICKY_NOTE_EDGE_SHADOW_OPACITY = 0.08;
export declare const DEFAULT_FONT_FAMILY: FontFamilyValues;
/** number of slots in the font-picker top-picks strip — pick customization
 * (replace / reorder) preserves it. Must equal `DEFAULT_FONTS.length` in
 * `packages/excalidraw/components/FontPicker/FontPicker.tsx` (enforced by
 * `fontTopPicks.test.ts`) */
export declare const FONT_TOP_PICKS_SLOTS = 3;
export declare const DEFAULT_TEXT_ALIGN = "left";
export declare const DEFAULT_VERTICAL_ALIGN = "top";
export declare const DEFAULT_VERSION = "{version}";
export declare const DEFAULT_TRANSFORM_HANDLE_SPACING = 2;
export declare const SIDE_RESIZING_THRESHOLD: number;
export declare const EPSILON = 0.00001;
export declare const DEFAULT_COLLISION_THRESHOLD: number;
export declare const COLOR_WHITE = "#ffffff";
export declare const COLOR_CHARCOAL_BLACK = "#1e1e1e";
export declare const COLOR_VOICE_CALL = "#a2f1a6";
export declare const CANVAS_ONLY_ACTIONS: string[];
export declare const DEFAULT_GRID_SIZE = 20;
export declare const DEFAULT_GRID_STEP = 5;
export declare const IMAGE_MIME_TYPES: {
    readonly svg: "image/svg+xml";
    readonly png: "image/png";
    readonly jpg: "image/jpeg";
    readonly gif: "image/gif";
    readonly webp: "image/webp";
    readonly bmp: "image/bmp";
    readonly ico: "image/x-icon";
    readonly avif: "image/avif";
    readonly jfif: "image/jfif";
};
export declare const STRING_MIME_TYPES: {
    readonly text: "text/plain";
    readonly html: "text/html";
    readonly json: "application/json";
    readonly excalidraw: "application/vnd.excalidraw+json";
    readonly excalidrawClipboard: "application/vnd.excalidraw.clipboard+json";
    readonly excalidrawlib: "application/vnd.excalidrawlib+json";
    readonly excalidrawlibIds: "application/vnd.excalidrawlib.ids+json";
};
export declare const MIME_TYPES: {
    readonly svg: "image/svg+xml";
    readonly png: "image/png";
    readonly jpg: "image/jpeg";
    readonly gif: "image/gif";
    readonly webp: "image/webp";
    readonly bmp: "image/bmp";
    readonly ico: "image/x-icon";
    readonly avif: "image/avif";
    readonly jfif: "image/jfif";
    readonly "excalidraw.svg": "image/svg+xml";
    readonly "excalidraw.png": "image/png";
    readonly binary: "application/octet-stream";
    readonly text: "text/plain";
    readonly html: "text/html";
    readonly json: "application/json";
    readonly excalidraw: "application/vnd.excalidraw+json";
    readonly excalidrawClipboard: "application/vnd.excalidraw.clipboard+json";
    readonly excalidrawlib: "application/vnd.excalidrawlib+json";
    readonly excalidrawlibIds: "application/vnd.excalidrawlib.ids+json";
};
export declare const ALLOWED_PASTE_MIME_TYPES: readonly ["text/plain", "text/html", ...("image/svg+xml" | "image/png" | "image/jpeg" | "image/gif" | "image/webp" | "image/bmp" | "image/x-icon" | "image/avif" | "image/jfif")[]];
export declare const EXPORT_IMAGE_TYPES: {
    readonly png: "png";
    readonly svg: "svg";
    readonly clipboard: "clipboard";
};
export declare const EXPORT_DATA_TYPES: {
    readonly excalidraw: "excalidraw";
    readonly excalidrawClipboard: "excalidraw/clipboard";
    readonly excalidrawLibrary: "excalidrawlib";
    readonly excalidrawClipboardWithAPI: "excalidraw-api/clipboard";
};
export declare const getExportSource: () => string;
export declare const IMAGE_RENDER_TIMEOUT = 500;
export declare const TAP_TWICE_TIMEOUT = 300;
export declare const TOUCH_CTX_MENU_TIMEOUT = 500;
export declare const TITLE_TIMEOUT = 10000;
export declare const VERSION_TIMEOUT = 30000;
export declare const SCROLL_TIMEOUT = 100;
export declare const ZEN_MODE_TRANSITION_DURATION = 250;
export declare const ZOOM_STEP = 0.1;
export declare const MIN_ZOOM = 0.1;
export declare const MAX_ZOOM = 30;
/** 100% zoom, for computations that have no editor zoom to go by */
export declare const DEFAULT_ZOOM: AppState["zoom"];
export declare const HYPERLINK_TOOLTIP_DELAY = 300;
export declare const IDLE_THRESHOLD = 60000;
export declare const ACTIVE_THRESHOLD = 3000;
export declare const URL_QUERY_KEYS: {
    readonly addLibrary: "addLibrary";
};
export declare const URL_HASH_KEYS: {
    readonly addLibrary: "addLibrary";
};
export declare const DEFAULT_UI_OPTIONS: AppProps["UIOptions"];
export declare const MAX_DECIMALS_FOR_SVG_EXPORT = 2;
export declare const EXPORT_SCALES: number[];
export declare const DEFAULT_EXPORT_PADDING = 10;
export declare const DEFAULT_IMAGE_OPTIONS: AppProps["imageOptions"];
export declare const SVG_NS = "http://www.w3.org/2000/svg";
export declare const SVG_DOCUMENT_PREAMBLE = "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n";
export declare const ENCRYPTION_KEY_BITS = 128;
export declare const VERSIONS: {
    readonly excalidraw: 2;
    readonly excalidrawLibrary: 2;
};
export declare const BOUND_TEXT_PADDING = 5;
export declare const ARROW_LABEL_WIDTH_FRACTION = 0.7;
export declare const ARROW_LABEL_FONT_SIZE_TO_MIN_WIDTH_RATIO = 11;
export declare const VERTICAL_ALIGN: {
    TOP: string;
    MIDDLE: string;
    BOTTOM: string;
};
export declare const TEXT_ALIGN: {
    LEFT: string;
    CENTER: string;
    RIGHT: string;
};
export declare const ELEMENT_READY_TO_ERASE_OPACITY = 20;
export declare const ELEMENT_PENDING_DRAW_SHAPE_OPACITY = 70;
export declare const DEFAULT_PROPORTIONAL_RADIUS = 0.25;
export declare const DEFAULT_ADAPTIVE_RADIUS = 32;
export declare const ROUNDNESS: {
    readonly LEGACY: 1;
    readonly PROPORTIONAL_RADIUS: 2;
    readonly ADAPTIVE_RADIUS: 3;
};
export declare const ROUGHNESS: {
    readonly architect: 0;
    readonly artist: 1;
    readonly cartoonist: 2;
};
export type StrokeWidthKey = "thin" | "medium" | "bold";
export declare const STROKE_WIDTH_KEYS: readonly StrokeWidthKey[];
export declare const STROKE_WIDTH: Readonly<Record<StrokeWidthKey | "extraBold", ExcalidrawElement["strokeWidth"]>>;
export declare const FREEDRAW_STROKE_WIDTH: Readonly<Record<StrokeWidthKey | "extraBold", ExcalidrawElement["strokeWidth"]>>;
export declare const getStrokeWidthByKey: (elementType: ExcalidrawElement["type"], strokeWidthKey: StrokeWidthKey) => ExcalidrawElement["strokeWidth"];
export declare const DEFAULT_ELEMENT_STROKE_WIDTH_KEY: StrokeWidthKey;
export declare const DEFAULT_ELEMENT_PROPS: {
    strokeColor: ExcalidrawElement["strokeColor"];
    backgroundColor: ExcalidrawElement["backgroundColor"];
    fillStyle: ExcalidrawElement["fillStyle"];
    strokeWidth: ExcalidrawElement["strokeWidth"];
    strokeStyle: ExcalidrawElement["strokeStyle"];
    roughness: ExcalidrawElement["roughness"];
    opacity: ExcalidrawElement["opacity"];
    locked: ExcalidrawElement["locked"];
};
export declare const LIBRARY_SIDEBAR_TAB = "library";
export declare const CANVAS_SEARCH_TAB = "search";
export declare const DEFAULT_SIDEBAR: {
    readonly name: "default";
    readonly defaultTab: "library";
};
export declare const LIBRARY_DISABLED_TYPES: Set<"embeddable" | "iframe" | "image">;
export declare const TOOL_TYPE: {
    readonly selection: "selection";
    readonly lasso: "lasso";
    readonly rectangle: "rectangle";
    readonly diamond: "diamond";
    readonly ellipse: "ellipse";
    readonly arrow: "arrow";
    readonly line: "line";
    readonly freedraw: "freedraw";
    readonly text: "text";
    readonly image: "image";
    readonly eraser: "eraser";
    readonly hand: "hand";
    readonly frame: "frame";
    readonly magicframe: "magicframe";
    readonly stickynote: "stickynote";
    readonly embeddable: "embeddable";
    readonly laser: "laser";
    readonly autoshape: "autoshape";
    readonly bucketfill: "bucketfill";
};
export declare const EDITOR_LS_KEYS: {
    readonly OAI_API_KEY: "excalidraw-oai-api-key";
    readonly MERMAID_TO_EXCALIDRAW: "mermaid-to-excalidraw";
    readonly PUBLISH_LIBRARY: "publish-library-data";
};
/**
 * not translated as this is used only in public, stateless API as default value
 * where filename is optional and we can't retrieve name from app state
 */
export declare const DEFAULT_FILENAME = "Untitled";
export declare const STATS_PANELS: {
    readonly generalStats: 1;
    readonly elementProperties: 2;
};
export declare const MIN_WIDTH_OR_HEIGHT = 1;
export declare const ARROW_TYPE: {
    [T in AppState["currentItemArrowType"]]: T;
};
export declare const DEFAULT_REDUCED_GLOBAL_ALPHA = 0.3;
export declare const ELEMENT_LINK_KEY = "element";
/** used in tests */
export declare const ORIG_ID: unique symbol;
export declare enum UserIdleState {
    ACTIVE = "active",
    AWAY = "away",
    IDLE = "idle"
}
/**
 * distance at which we merge points instead of adding a new merge-point
 * when converting a line to a polygon (merge currently means overlaping
 * the start and end points)
 */
export declare const LINE_POLYGON_POINT_MERGE_DISTANCE = 20;
export declare const DOUBLE_TAP_POSITION_THRESHOLD = 35;
export declare const BIND_MODE_TIMEOUT = 700;
export declare const MOBILE_ACTION_BUTTON_BG: {
    readonly background: "var(--mobile-action-button-bg)";
};
export declare const DEFAULT_STROKE_STREAMLINE = 0.5;
export declare const DEFAULT_STROKE_STREAMLINE_PRECISE = 0.2;
