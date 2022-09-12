import { MissingParametersError } from "./errors";

export type ConnectCrossposterArgs = {
  token: string,
}

export type ConnectCrossposterPayload = {
  userId: string,
}

const hasBooleanParam = (payload: unknown, param: string) =>
  payload &&
  typeof payload === "object" &&
  param in payload &&
  typeof payload[param] === "boolean";

const hasStringParam = (payload: unknown, param: string) =>
  payload &&
  typeof payload === "object" &&
  param in payload &&
  typeof payload[param] === "string" &&
  payload[param].length;

export const validateConnectCrossposterPayload = (payload: unknown): payload is ConnectCrossposterPayload => {
  if (!hasStringParam(payload, "userId")) {
    throw new MissingParametersError(["userId"], payload);
  }
  return true;
}

export type UnlinkCrossposterPayload = {
  userId: string,
}

export const validateUnlinkCrossposterPayload = (payload: unknown): payload is UnlinkCrossposterPayload => {
  if (!hasStringParam(payload, "userId")) {
    throw new MissingParametersError(["userId"], payload);
  }
  return true;
}

export type UpdateCrosspostPayload = {
  postId: string,
  draft: boolean,
  deletedDraft: boolean,
  title: string,
}

export const validateUpdateCrosspostPayload = (payload: unknown): payload is UpdateCrosspostPayload => {
  if (
    !hasStringParam(payload, "postId") ||
    !hasBooleanParam(payload, "draft") ||
    !hasBooleanParam(payload, "deletedDraft") ||
    !hasStringParam(payload, "title")
  ) {
    throw new MissingParametersError(["postId", "draft", "draftDeleted", "title"], payload);
  }
  return true;
}

export type CrosspostPayload = {
  localUserId: string,
  foreignUserId: string,
}

export const validateCrosspostPayload = (payload: unknown): payload is CrosspostPayload => {
  if (
    !hasStringParam(payload, "localUserId") ||
    !hasStringParam(payload, "foreignUserId")
  ) {
    throw new MissingParametersError(["localUserId", "foreignUserId"], payload);
  }
  return true;
}

export type Crosspost = Pick<DbPost, "_id" | "title" | "userId" | "fmCrosspost" | "draft">;
