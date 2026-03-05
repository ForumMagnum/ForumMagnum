export interface SerializedRequestCookie {
  name: string;
  value: string;
}

export interface WorkerContextInitPayload {
  requestId: string;
  loginToken: string | null;
  cookies: SerializedRequestCookie[];
  headerEntries: Array<[string, string]>;
  searchParamEntries: Array<[string, string]>;
}

export interface WorkerRunQueryPayload {
  requestId: string;
  querySource: string;
  variables: Record<string, unknown>;
  operationName?: string;
}

interface WorkerMessageBase {
  messageId: number;
}

export interface WorkerInitContextMessage extends WorkerMessageBase {
  type: "initContext";
  payload: WorkerContextInitPayload;
}

export interface WorkerRunQueryMessage extends WorkerMessageBase {
  type: "runQuery";
  payload: WorkerRunQueryPayload;
}

export interface WorkerDisposeContextMessage extends WorkerMessageBase {
  type: "disposeContext";
  payload: { requestId: string };
}

export interface WorkerHealthMessage extends WorkerMessageBase {
  type: "health";
}

export type WorkerRequestMessage =
  | WorkerInitContextMessage
  | WorkerRunQueryMessage
  | WorkerDisposeContextMessage
  | WorkerHealthMessage;

export interface WorkerErrorPayload {
  message: string;
  stack?: string;
}

export type WorkerResponsePayload = unknown;

export interface WorkerSuccessResponse extends WorkerMessageBase {
  ok: true;
  payload: WorkerResponsePayload;
}

export interface WorkerErrorResponse extends WorkerMessageBase {
  ok: false;
  error: WorkerErrorPayload;
}

export type WorkerResponseMessage = WorkerSuccessResponse | WorkerErrorResponse;
