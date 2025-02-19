// This file runs in a quirky jest execution environment - importing things might break
// unexpectedly in unit tests. Try not to import anything.

export const wrapConsoleLogFunctions = (wrapper: (originalFn: any, ...message: any[]) => void) => {
  for (let functionName of ["log", "info", "warn", "error", "trace"] as const) {
    // eslint-disable-next-line no-console
    const originalFn = console[functionName];
    // eslint-disable-next-line no-console
    console[functionName] = (...message: any[]) => {
      wrapper(originalFn, ...message);
    }
  }
}

export const filterConsoleLogSpam = () => {
  // Suppress this deprecation warning because MaterialUI is on an old version that 
  // produces a separate warning for every unit test.
  const oldWarn = console.warn; //eslint-disable-line no-console
  console.warn = (...message: any[]) => { //eslint-disable-line no-console
    if (message[0]?.indexOf?.("React.createFactory() is deprecated") >= 0) {
      return;
    }
    oldWarn(...message);
  }
}
