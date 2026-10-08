// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { CaptureUpdateAction } from "@excalidraw/element";

import { register } from "./register";

export const actionToggleMidpointSnapping = register({
  name: "midpointSnapping",
  label: "labels.midpointSnapping",
  viewMode: false,
  trackEvent: {
    category: "canvas",
    predicate: (appState) => !appState.isMidpointSnappingEnabled,
  },
  perform(elements, appState) {
    return {
      appState: {
        ...appState,
        isMidpointSnappingEnabled: !this.checked!(appState),
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    };
  },
  checked: (appState) => appState.isMidpointSnappingEnabled,
});
