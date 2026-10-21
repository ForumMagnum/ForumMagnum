// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { CODES, KEYS } from "@excalidraw/common";

import { CaptureUpdateAction } from "@excalidraw/element";

import { coffeeIcon } from "../components/icons";

import { register } from "./register";

export const actionToggleZenMode = register({
  name: "zenMode",
  label: "buttons.zenMode",
  icon: coffeeIcon,
  viewMode: true,
  trackEvent: {
    category: "canvas",
    predicate: (appState) => !appState.zenModeEnabled,
  },
  perform(elements, appState) {
    return {
      appState: {
        ...appState,
        zenModeEnabled: !this.checked!(appState),
      },
      captureUpdate: CaptureUpdateAction.EVENTUALLY,
    };
  },
  checked: (appState) => appState.zenModeEnabled,
  predicate: (elements, appState, appProps, app) => {
    return (
      app.editorInterface.formFactor !== "phone" &&
      typeof appProps.zenModeEnabled === "undefined"
    );
  },
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.Z,
});
