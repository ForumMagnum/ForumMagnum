export class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super(403, "You must login to do this");
  }
}

export class MissingSecretError extends ApiError {
  constructor() {
    super(500, "Missing crosspost signing secret env var");
  }
}

export class MissingParametersError extends ApiError {
  constructor(expectedParams: string[], body: any) {
    super(400, `Missing parameters: expected ${JSON.stringify(expectedParams)} but received ${JSON.stringify(body)}`);
  }
}

export class InvalidUserError extends ApiError {
  constructor() {
    super(400, "Invalid user");
  }
}
