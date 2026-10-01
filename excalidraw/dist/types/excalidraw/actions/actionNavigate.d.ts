export declare const actionGoToCollaborator: import("./types").Action<Readonly<{
    pointer?: import("../types").CollaboratorPointer;
    button?: "up" | "down";
    selectedElementIds?: import("../types").AppState["selectedElementIds"];
    username?: string | null;
    userState?: import("../../common/src/index").UserIdleState;
    color?: {
        background: string;
        stroke: string;
    };
    avatarUrl?: string;
    id?: string;
    socketId?: import("../types").SocketId;
    isCurrentUser?: boolean;
    isInCall?: boolean;
    isSpeaking?: boolean;
    isMuted?: boolean;
}>> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: import("../types").AppState, elements: readonly import("../../element/src/types").ExcalidrawElement[], app: import("../types").AppClassProperties) => boolean) | undefined;
};
