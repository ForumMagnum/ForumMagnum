// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

export type ChartElements = readonly NonDeletedExcalidrawElement[];

export interface Spreadsheet {
  title: string | null;
  labels: string[] | null;
  series: SpreadsheetSeries[];
}

export interface SpreadsheetSeries {
  title: string | null;
  values: number[];
}

export type ParseSpreadsheetResult =
  | { ok: false; reason: string }
  | { ok: true; data: Spreadsheet };
