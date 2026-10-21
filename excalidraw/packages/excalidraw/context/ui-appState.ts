// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import React from "react";

import type { UIAppState } from "../types";

export const UIAppStateContext = React.createContext<UIAppState>(null!);
export const useUIAppState = () => React.useContext(UIAppStateContext);
