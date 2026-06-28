export const EXPIRED_SANDBOX_SAVE_MESSAGE =
  "That sandbox has expired or is no longer available, so it can't be saved as an environment. " +
  "Start a new turn to recreate the sandbox, then try saving again.";

export class ResearchSandboxUnavailableError extends Error {
  constructor(message = EXPIRED_SANDBOX_SAVE_MESSAGE) {
    super(message);
    this.name = "ResearchSandboxUnavailableError";
  }
}

function messageMentionsExpiredSandbox(message: string): boolean {
  return /\bstatus code\s*410\b/i.test(message)
    || /\b410\s+is\s+not\s+ok\b/i.test(message)
    || /\bHTTP\s*410\b/i.test(message);
}

function objectHasStatus410(error: object): boolean {
  return ("status" in error && error.status === 410)
    || ("statusCode" in error && error.statusCode === 410);
}

export function isExpiredSandboxError(error: unknown): boolean {
  if (typeof error === "string") {
    return messageMentionsExpiredSandbox(error);
  }

  if (error instanceof Error) {
    if (messageMentionsExpiredSandbox(error.message)) {
      return true;
    }
    if ("cause" in error && isExpiredSandboxError(error.cause)) {
      return true;
    }
  }

  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (objectHasStatus410(error)) {
    return true;
  }

  if (
    "message" in error
    && typeof error.message === "string"
    && messageMentionsExpiredSandbox(error.message)
  ) {
    return true;
  }

  if ("response" in error && isExpiredSandboxError(error.response)) {
    return true;
  }

  if ("cause" in error && isExpiredSandboxError(error.cause)) {
    return true;
  }

  return false;
}
