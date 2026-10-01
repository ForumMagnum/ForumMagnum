import { getFontString } from "../../common/src/index";
import type { ChartType } from "../../element/src/types";
import type { NonDeletedExcalidrawElement } from "../../element/src/types";
import { type CartesianChartLayout, type CartesianChartType } from "./charts.constants";
import type { ChartElements, Spreadsheet, SpreadsheetSeries } from "./charts.types";
export declare const isSpreadsheetValidForChartType: (spreadsheet: Spreadsheet | null, chartType: ChartType) => boolean;
export declare const getCartesianChartLayout: (chartType: CartesianChartType, seriesCount: number) => CartesianChartLayout;
export declare const getChartDimensions: (spreadsheet: Spreadsheet, layout: CartesianChartLayout) => {
    chartWidth: number;
    chartHeight: number;
};
export declare const getRadarDimensions: () => {
    chartWidth: number;
    chartHeight: number;
};
export declare const getSeriesColors: (seriesCount: number, colorOffset: number) => readonly string[];
export declare const getColorOffset: (colorSeed?: number) => number;
export declare const getBackgroundColor: (colorOffset: number) => "#fff5f5" | "#ffc9c9" | "#ff8787" | "#fa5252" | "#e03131" | "#fff0f6" | "#fcc2d7" | "#f783ac" | "#e64980" | "#c2255c" | "#f8f0fc" | "#eebefa" | "#da77f2" | "#be4bdb" | "#9c36b5" | "#f3f0ff" | "#d0bfff" | "#9775fa" | "#7950f2" | "#6741d9" | "#e7f5ff" | "#a5d8ff" | "#4dabf7" | "#228be6" | "#1971c2" | "#e3fafc" | "#99e9f2" | "#3bc9db" | "#15aabf" | "#0c8599" | "#e6fcf5" | "#96f2d7" | "#38d9a9" | "#12b886" | "#099268" | "#ebfbee" | "#b2f2bb" | "#69db7c" | "#40c057" | "#2f9e44" | "#fff9db" | "#ffec99" | "#ffd43b" | "#fab005" | "#f08c00" | "#fff4e6" | "#ffd8a8" | "#ffa94d" | "#fd7e14" | "#e8590c";
export declare const getRadarValueScale: (series: SpreadsheetSeries[], _labelsLength: number) => {
    renderSteps: boolean;
    normalize: (value: number, _axisIndex: number) => number;
};
export declare const getRadarDisplayText: (text: string, fontString: ReturnType<typeof getFontString>, maxWidth: number) => string;
export declare const createRadarAxisLabels: (labels: readonly string[], angles: readonly number[], centerX: number, centerY: number, radius: number, backgroundColor: string) => {
    axisLabels: ChartElements;
    axisLabelTopY: number;
    axisLabelBottomY: number;
};
export declare const createSeriesLegend: (series: SpreadsheetSeries[], seriesColors: readonly string[], centerX: number, minLegendTopY: number, fallbackLegendY: number, backgroundColor: string) => ChartElements;
export declare const getRotatedTextElementBottom: (element: NonDeletedExcalidrawElement) => number;
export declare const chartXLabels: (spreadsheet: Spreadsheet, x: number, y: number, backgroundColor: string, layout: CartesianChartLayout) => ChartElements;
export declare const chartBaseElements: (spreadsheet: Spreadsheet, x: number, y: number, backgroundColor: string, layout: CartesianChartLayout, maxValue?: number, debug?: boolean) => ChartElements;
