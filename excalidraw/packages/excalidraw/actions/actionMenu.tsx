// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { KEYS } from "@excalidraw/common";

import { CaptureUpdateAction } from "@excalidraw/element";

import { HelpIconThin } from "../components/icons";

import { register } from "./register";

export const actionShortcuts = register({
  name: "toggleShortcuts",
  label: "welcomeScreen.defaults.helpHint",
  icon: HelpIconThin,
  viewMode: true,
  trackEvent: { category: "menu", action: "toggleHelpDialog" },
  perform: (_elements, appState, _, { focusContainer }) => {
    if (appState.openDialog?.name === "help") {
      focusContainer();
    }
    return {
      appState: {
        ...appState,
        openDialog:
          appState.openDialog?.name === "help"
            ? null
            : {
                name: "help",
              },
        openMenu: null,
        openPopup: null,
      },
      captureUpdate: CaptureUpdateAction.EVENTUALLY,
    };
  },
  keyTest: (event) => event.key === KEYS.QUESTION_MARK,
});
