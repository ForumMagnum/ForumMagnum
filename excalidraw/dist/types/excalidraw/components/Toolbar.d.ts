import type { AppClassProperties, AppProps, AppState, UIAppState } from "../types";
/** the main (desktop/tablet) toolbar island */
export declare const Toolbar: ({ app, appState, setAppState, UIOptions, onPenModeToggle, onLockToggle, heading, }: {
    app: AppClassProperties;
    appState: UIAppState;
    setAppState: React.Component<any, AppState>["setState"];
    UIOptions: AppProps["UIOptions"];
    onPenModeToggle: AppClassProperties["togglePenMode"];
    onLockToggle: () => void;
    heading: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
