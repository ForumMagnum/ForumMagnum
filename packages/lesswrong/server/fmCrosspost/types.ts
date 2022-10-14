import { MissingParametersError } from "./errors";
import { denormalizedFieldKeys, DenormalizedCrosspostData, isValidDenormalizedData } from "./denormalizedFields";
import { hasStringParam } from "./validationHelpers";

export type ConnectCrossposterArgs = {
  token: string,
}

export type ConnectCrossposterPayload = {
  userId: string,
}

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

export type UpdateCrosspostPayload = DenormalizedCrosspostData & { postId: string }

export const validateUpdateCrosspostPayload = (payload: unknown): payload is UpdateCrosspostPayload => {
  if (!hasStringParam(payload, "postId") || !isValidDenormalizedData(payload)) {
    throw new MissingParametersError(["postId", ...denormalizedFieldKeys], payload);
  }
  return true;
}

export type CrosspostPayload = DenormalizedCrosspostData & {
  localUserId: string,
  foreignUserId: string,
  postId: string,
}

export const validateCrosspostPayload = (payload: unknown): payload is CrosspostPayload => {
  if (
    !hasStringParam(payload, "localUserId") ||
    !hasStringParam(payload, "foreignUserId") ||
    !hasStringParam(payload, "postId") ||
    !isValidDenormalizedData(payload)
  ) {
    throw new MissingParametersError(["localUserId", "foreignUserId", "postId", ...denormalizedFieldKeys], payload);
  }
  return true;
}

export type Crosspost = Pick<DbPost, "_id" | "userId" | "fmCrosspost" | typeof denormalizedFieldKeys[number]>;
