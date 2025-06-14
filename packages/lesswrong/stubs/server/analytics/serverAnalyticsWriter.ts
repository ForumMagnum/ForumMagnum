
export function serverWriteEvent() {
  throw new Error("This function can only be called on the server");
}

export function serverCaptureEvent() {
  throw new Error("This function can only be called on the server");
}