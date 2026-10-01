import type { AppClassProperties, AppState, ToolType, UIAppState } from "../types";
export type ToolConfig = {
    icon: React.ReactNode;
    /** letter shortcut(s) — the first one is shown in tooltips and badges */
    letterKey?: string | readonly string[];
    /** whether `letterKey` requires Shift to be held (e.g. Shift+X) */
    shiftKey?: boolean;
    numericKey?: string;
    /** whether the tool's shapes can be filled — fills the icon when active */
    fillable?: boolean;
    /**
     * re-activating the tool switches back to the previously active tool
     * (via the keyboard shortcut or ESC — see `setActiveTool`'s `toggle`
     * option)
     */
    toggle?: boolean;
};
/**
 * Tool data — the single source of truth for tool buttons, keyboard
 * shortcuts (`findShapeByKey`), and the command palette. Toolbar placement
 * is not defined here: toolbars compose the `*ToolButton` components below
 * manually, so entries without a toolbar slot (e.g. laser) are data-only.
 */
export declare const TOOLS: {
    hand: ToolConfig;
    selection: ToolConfig;
    rectangle: ToolConfig;
    diamond: ToolConfig;
    ellipse: ToolConfig;
    arrow: ToolConfig;
    line: ToolConfig;
    freedraw: ToolConfig;
    text: ToolConfig;
    stickynote: ToolConfig;
    image: ToolConfig;
    eraser: ToolConfig;
    frame: ToolConfig;
    autoshape: ToolConfig;
    embeddable: ToolConfig;
    laser: ToolConfig;
    bucketfill: ToolConfig;
    lasso: ToolConfig;
};
export type ToolbarToolType = keyof typeof TOOLS;
/**
 * tools that, when activated while already active, switch back to the
 * previously active tool (see `setActiveTool`'s `toggle` option)
 */
export declare const TOGGLE_TOOLS: readonly (ToolType | "custom")[];
export declare const getToolLetter: (type: ToolbarToolType) => string | undefined;
/** human-readable shortcut hint, e.g. "R or 2", used in tooltips & aria */
export declare const getToolShortcut: (type: ToolbarToolType) => string;
export declare const findShapeByKey: (key: string, app: AppClassProperties, shiftKey?: boolean) => "line" | "arrow" | "text" | "selection" | "rectangle" | "stickynote" | "diamond" | "ellipse" | "embeddable" | "image" | "frame" | "freedraw" | "lasso" | "eraser" | "hand" | "laser" | "autoshape" | "bucketfill" | null;
/**
 * Whether a toolbar entry activating the given tool renders disabled — true
 * when the active tool is host-controlled (`props.activeTool`) and the entry
 * doesn't activate the forced tool (`setActiveTool` refuses it).
 */
export declare const isToolButtonDisabled: (app: AppClassProperties, type: string) => boolean;
export type ToolButtonComponentProps = {
    app: AppClassProperties;
    activeTool: UIAppState["activeTool"];
    /** hide the keybinding badge rendered in the button's corner */
    hideKeyBinding?: boolean;
    /**
     * hide all shortcut affordances (tooltip hint, aria-keyshortcuts, and the
     * keybinding badge) — used on mobile where there's no keyboard
     */
    hideShortcut?: boolean;
};
export declare const HandToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const RectangleToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const DiamondToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const EllipseToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const ArrowToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const LineToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const FreedrawToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const TextToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const StickyNoteToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const ImageToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const EraserToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export declare const FrameToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * The selection tool button — pointer-clicking it while the selection tool
 * is active switches to lasso.
 */
export declare const SelectionToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * Rendered in place of the selection button when lasso is the preferred
 * selection tool; the selection shortcut activates it then.
 */
export declare const LassoToolButton: {
    ({ app, activeTool, hideKeyBinding, hideShortcut, }: ToolButtonComponentProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * The selection ⇄ lasso popover used in compact (tablet) and mobile
 * toolbars; picking an option also makes it the preferred selection tool.
 */
export declare const SelectionToolPopover: ({ app, activeTool, setAppState, }: {
    app: AppClassProperties;
    activeTool: UIAppState["activeTool"];
    setAppState: React.Component<any, AppState>["setState"];
}) => import("react/jsx-runtime").JSX.Element;
/**
 * The freedraw ⇄ draw-shape popover used in compact (tablet) and mobile
 * toolbars. The trigger remembers and displays the most recently used option.
 */
export declare const FreedrawToolPopover: ({ app, activeTool, }: {
    app: AppClassProperties;
    activeTool: UIAppState["activeTool"];
}) => import("react/jsx-runtime").JSX.Element;
