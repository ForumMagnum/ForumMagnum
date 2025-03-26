export type ColorFormat = 'rgb' | 'rgba' | 'hsl' | 'hsla';
export interface ColorObject {
  type: ColorFormat;
  values: [number, number, number] | [number, number, number, number];
}

export function recomposeColor(color: ColorObject): string;
export function convertHexToRGB(hex: string): string;
export function rgbToHex(color: string): string;
export function decomposeColor(color: string): ColorObject;
export function getContrastRatio(foreground: string, background: string): number;
export function getLuminance(color: string): number;
export function emphasize(color: string, coefficient?: number): string;
export function fade(color: string, value: number): string;
export function darken(color: string, coefficient?: number): string;
export function lighten(color: string, coefficient?: number): string;
