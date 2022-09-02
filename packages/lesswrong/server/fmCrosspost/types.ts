import { MissingParametersError } from "./errors";

export type ConnectCrossposterArgs = {
  token: string,
}

export type ConnectCrossposterPayload = {
  userId: string,
}

export const validateConnectCrossposterPayload = (payload: ConnectCrossposterPayload) => {
  if (!payload.userId || typeof payload.userId !== "string") {
    throw new MissingParametersError(["userId"], payload);
  }
}

export type UnlinkCrossposterPayload = {
  userId: string,
}

export const validateUnlinkCrossposterPayload = (payload: UnlinkCrossposterPayload) => {
  if (!payload.userId || typeof payload.userId !== "string") {
    throw new MissingParametersError(["userId"], payload);
  }
}

export type UpdateCrosspostPayload = {
  postId: string,
  draft: boolean,
  deletedDraft: boolean,
  title: string,
}

export const validateUpdateCrosspostPayload = (payload: UpdateCrosspostPayload) => {
  if (
    !payload.postId || typeof payload.postId !== "string" ||
    typeof payload.draft !== "boolean" ||
    typeof payload.deletedDraft !== "boolean" ||
    !payload.title || typeof payload.title !== "string"
  ) {
    throw new MissingParametersError(["postId", "draft", "draftDeleted", "title"], payload);
  }
}

export type CrosspostPayload = {
  localUserId: string,
  foreignUserId: string,
}

export const validateCrosspostPayload = (payload: CrosspostPayload) => {
  if (
    !payload.localUserId || typeof payload.localUserId !== "string" ||
    !payload.foreignUserId || typeof payload.foreignUserId !== "string"
  ) {
    throw new MissingParametersError(["localUserId", "foreignUserId"], payload);
  }
}

export type Crosspost = Pick<DbPost, "_id" | "title" | "userId" | "fmCrosspost" | "draft">;
