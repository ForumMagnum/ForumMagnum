import "./UnlockPopup.scss";
import type App from "./App";
import type { AppState } from "../types";
declare const UnlockPopup: ({ app, activeLockedId, }: {
    app: App;
    activeLockedId: NonNullable<AppState["activeLockedId"]>;
}) => import("react/jsx-runtime").JSX.Element | null;
export default UnlockPopup;
