import type { OrderedExcalidrawElement } from "../../element/src/types";
import type { MakeBrand } from "../../common/src/utility-types";
import type { AppState } from "../types";
export type ReconciledExcalidrawElement = OrderedExcalidrawElement & MakeBrand<"ReconciledElement">;
export type RemoteExcalidrawElement = OrderedExcalidrawElement & MakeBrand<"RemoteExcalidrawElement">;
export declare const shouldDiscardRemoteElement: (localAppState: AppState, local: OrderedExcalidrawElement | undefined, remote: RemoteExcalidrawElement) => boolean;
export declare const reconcileElements: (localElements: readonly OrderedExcalidrawElement[], remoteElements: readonly RemoteExcalidrawElement[], localAppState: AppState) => ReconciledExcalidrawElement[];
