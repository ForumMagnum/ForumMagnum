import { type ParseSpreadsheetResult } from "./charts.types";
/**
 * @private exported for testing
 */
export declare const tryParseNumber: (s: string) => number | null;
/**
 * @private exported for testing
 */
export declare const tryParseCells: (cells: string[][]) => ParseSpreadsheetResult;
export declare const tryParseSpreadsheet: (text: string) => ParseSpreadsheetResult;
