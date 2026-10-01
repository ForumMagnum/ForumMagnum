import * as defaultItems from "./defaultCommandPaletteItems";
import "./CommandPalette.scss";
import type { CommandPaletteItem } from "./types";
export declare const DEFAULT_CATEGORIES: {
    app: string;
    export: string;
    tools: string;
    editor: string;
    elements: string;
    links: string;
    library: string;
};
type CommandPaletteProps = {
    customCommandPaletteItems?: CommandPaletteItem[];
};
export declare const CommandPalette: ((props: CommandPaletteProps) => import("react/jsx-runtime").JSX.Element | null) & {
    defaultItems: typeof defaultItems;
};
export {};
