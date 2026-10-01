import type { ActionManager } from "../../actions/manager";
import type { UIAppState } from "../../types";
declare const Footer: {
    ({ appState, actionManager, showExitZenModeBtn, renderWelcomeScreen, defaultUIEnabled, zoomUIEnabled, }: {
        appState: UIAppState;
        actionManager: ActionManager;
        showExitZenModeBtn: boolean;
        renderWelcomeScreen: boolean;
        defaultUIEnabled: boolean;
        zoomUIEnabled: boolean;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export default Footer;
