import "./TTDDialog.scss";
import type { TTDPersistenceAdapter, TTTDDialog } from "./types";
export declare const TTDDialog: {
    (props: {
        onTextSubmit: TTTDDialog.onTextSubmit;
        renderWelcomeScreen?: TTTDDialog.renderWelcomeScreen;
        renderWarning?: TTTDDialog.renderWarning;
        persistenceAdapter: TTDPersistenceAdapter;
    } | {
        __fallback: true;
    }): import("react/jsx-runtime").JSX.Element | null;
    WelcomeMessage: () => import("react/jsx-runtime").JSX.Element;
};
