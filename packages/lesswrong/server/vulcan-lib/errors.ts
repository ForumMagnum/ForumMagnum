

/*

An error should have: 

- id: will be used as i18n key (note: available as `name` on the client)
- message: optionally, a plain-text message
- data: data/values to give more context to the error

*/
export function throwError(error: { id: string; data?: Record<string, AnyBecauseTodo> }): never {
  throw new Error(`${error.id}: ${error.data}`);
};
