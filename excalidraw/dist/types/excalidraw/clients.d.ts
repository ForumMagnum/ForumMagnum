import type { InteractiveCanvasRenderConfig } from "./scene/types";
import type { Collaborator, InteractiveCanvasAppState, SocketId } from "./types";
export declare const getClientColor: (socketId: SocketId, collaborator: Collaborator | undefined) => string;
/**
 * returns first char, capitalized
 */
export declare const getNameInitial: (name?: string | null) => string;
export declare const renderRemoteCursors: ({ context, renderConfig, appState, normalizedWidth, normalizedHeight, }: {
    context: CanvasRenderingContext2D;
    renderConfig: InteractiveCanvasRenderConfig;
    appState: InteractiveCanvasAppState;
    normalizedWidth: number;
    normalizedHeight: number;
}) => void;
