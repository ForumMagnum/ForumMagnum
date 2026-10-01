import React from "react";
import "./UserList.scss";
import type { Collaborator, SocketId } from "../types";
export type GoToCollaboratorComponentProps = {
    socketId: SocketId;
    collaborator: Collaborator;
    withName: boolean;
    isBeingFollowed: boolean;
};
type UserListUserObject = Pick<Collaborator, "avatarUrl" | "id" | "socketId" | "username" | "isInCall" | "isSpeaking" | "isMuted" | "isCurrentUser">;
type UserListProps = {
    className?: string;
    mobile?: boolean;
    collaborators: Map<SocketId, UserListUserObject>;
    userToFollow: SocketId | null;
    currentUserControls?: React.ReactNode | ((isMobile: boolean) => React.ReactNode);
};
export declare const UserList: React.MemoExoticComponent<({ className, mobile, collaborators, userToFollow, currentUserControls, }: UserListProps) => import("react/jsx-runtime").JSX.Element>;
export {};
