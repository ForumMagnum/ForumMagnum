import type { ModerationTemplateData, NextItemResponse, QueueItem, QueueResponse, ReviewCollectionName, RunCheckResponse, UserContextResponse } from './types';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class ConflictError extends ApiError {
  currentEarliest: QueueItem | null;

  constructor(message: string, currentEarliest: QueueItem | null) {
    super(409, message);
    this.currentEarliest = currentEarliest;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error ?? `Request failed (${response.status})`;
    if (response.status === 409) {
      throw new ConflictError(message, body?.currentEarliest ?? null);
    }
    throw new ApiError(response.status, message);
  }
  return body as T;
}

function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function fetchQueue(): Promise<QueueResponse> {
  return request<QueueResponse>('/api/queue');
}

export function fetchTemplates(collection: 'Rejections' | 'Messages'): Promise<{ templates: ModerationTemplateData[]; rejectionIntroHtml: string }> {
  return request(`/api/templates?collection=${collection}`);
}

export function fetchUserContext(userId: string): Promise<UserContextResponse> {
  return request(`/api/user-context?userId=${encodeURIComponent(userId)}`);
}

export function runCheck(input: { collectionName: ReviewCollectionName; documentId: string }): Promise<RunCheckResponse> {
  return post('/api/actions/run-check', { ...input });
}

export interface ItemActionInput {
  userId: string;
  collectionName: ReviewCollectionName;
  documentId: string;
}

export function approveItem(input: ItemActionInput): Promise<NextItemResponse> {
  return post('/api/actions/approve', { ...input });
}

export function rejectItem(input: ItemActionInput & { rejectedReason: string }): Promise<NextItemResponse> {
  return post('/api/actions/reject', { ...input });
}

export function approveItemAndDm(input: ItemActionInput & { messageHtml: string }): Promise<NextItemResponse> {
  return post('/api/actions/approve-and-dm', { ...input });
}

export function skipUser(userId: string): Promise<{ ok: true }> {
  return post('/api/actions/skip', { userId });
}

export function approveUser(userId: string): Promise<{ ok: true }> {
  return post('/api/actions/approve-user', { userId });
}

export function offboardUser(input: {
  userId: string;
  rejections: { collectionName: ReviewCollectionName; documentId: string; rejectedReason: string }[];
  removePermissions: boolean;
  messageHtml?: string;
}): Promise<{ ok: true }> {
  return post('/api/actions/offboard', { ...input });
}
