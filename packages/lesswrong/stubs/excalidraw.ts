// Jest stand-in for `@excalidraw/excalidraw` (mapped in jest.config.ts): the
// real module (the vendored build in excalidraw/dist) uses browser globals at
// module scope, so it can't be loaded in unit tests, which import it
// indirectly (eg themePalette.tests.ts imports every component with styles).
function excalidrawNotAvailable(): never {
  throw new Error("Excalidraw is not available in unit tests");
}

export const Excalidraw = excalidrawNotAvailable;
export const exportToSvg = excalidrawNotAvailable;
export const getNonDeletedElements = excalidrawNotAvailable;
export const hashElementsVersion = excalidrawNotAvailable;
