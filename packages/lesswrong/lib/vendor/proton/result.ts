export class Result<T> {
  private readonly value?: T;
  private readonly error?: string;

  private constructor(value?: T, error?: string) {
    this.value = value;
    this.error = error;
  }

  static ok<T>(value: T): Result<T> {
    return new Result(value, undefined);
  }

  static fail<T>(error: string): Result<T> {
    return new Result<T>(undefined, error);
  }

  isFailed(): boolean {
    return this.error !== undefined;
  }

  getValue(): T {
    if (this.error !== undefined) {
      throw new Error(this.error);
    }
    return this.value as T;
  }

  getError(): string | undefined {
    return this.error;
  }
}
