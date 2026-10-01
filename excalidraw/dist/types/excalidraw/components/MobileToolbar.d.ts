import "./ToolIcon.scss";
import "./MobileToolbar.scss";
import type { AppClassProperties, UIAppState } from "../types";
type MobileToolbarProps = {
    app: AppClassProperties;
    setAppState: React.Component<any, UIAppState>["setState"];
};
export declare const MobileToolbar: ({ app, setAppState }: MobileToolbarProps) => import("react/jsx-runtime").JSX.Element;
export {};
