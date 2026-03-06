import { isLWorAF } from "../lib/instanceSettings";
import mapValues from "lodash/mapValues";

type ColorTuple=[number,number,number,number]; //RGBA, all channels floating point zero to one

function fromHexDigit(s: string, offset: number): number {
  let ch = s.charCodeAt(offset);
  if (ch>=48 && ch<58) return ch-48; //'0'-'9'
  else if (ch>=97 && ch<=102) return ch-97+10; //'a'-'f'
  else if (ch>=65 && ch<=70) return ch-65+10; //'A'-'F'
  else return 0;
}
function toHexDigit(n: number) {
  if (n>=0 && n<10) return String.fromCharCode(48+n);
  else if (n>=10 && n<=15) return String.fromCharCode(87+n);
  else throw new Error(`Not a hex digit: ${n}`);
}
function toHex2(n: number): string {
  if (n<0 || n>1.0) throw new Error("Color channel out of range");
  let rescaled = n*255.0;
  return toHexDigit(Math.floor(rescaled/16))+toHexDigit(Math.floor(rescaled%16));
}

export function parseColor(color: string): ColorTuple|null
{
  switch(color) {
    case "white": return [1,1,1,1];
    case "black": return [0,0,0,1];
    case "transparent": return [0,0,0,0];
    case "inherit": return null;
    default: break;
  }
  if (color.startsWith("#")) {
    // #rrggbb or #rgb format
    if (/#[0-9a-fA-F]{6}/i.test(color)) {
      const r = (fromHexDigit(color,1)*16) + fromHexDigit(color,2); //0-255
      const g = (fromHexDigit(color,3)*16) + fromHexDigit(color,4); //0-255
      const b = (fromHexDigit(color,5)*16) + fromHexDigit(color,6); //0-255
      return [r/255.0, g/255.0, b/255.0, 1.0];
    } else if (/#[0-9a-fA-F]{3}/i.test(color)) {
      const r = fromHexDigit(color,1); //0-15
      const g = fromHexDigit(color,2); //0-15
      const b = fromHexDigit(color,3); //0-15
      return [r/15.0, g/15.0, b/15.0, 1.0];
    }
  } else {
    const match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+)?\)/.exec(color);
    if (match) {
      const [color,r,g,b,a] = match;
      const parsedR = parseFloat(r) / 255.0;
      const parsedG = parseFloat(g) / 255.0;
      const parsedB = parseFloat(b) / 255.0;
      const parsedA = (a !== undefined) ? parseFloat(a.substring(1)) : 1.0;
      return [parsedR, parsedG, parsedB, parsedA];
    }
    // TODO: Support more color formats
    return null;
  }
  return null;
}

export const zeroTo255 = (n: number): string => ""+Math.floor(n*255);

export function colorToString(color: ColorTuple): string
{
  const [r,g,b,a] = color;
  if (a>=1.0) {
    return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
  } else {
    return `rgba(${zeroTo255(r)},${zeroTo255(g)},${zeroTo255(b)},${a})`
  }
}

// HACK: Gamma here is tuned empirically for a visual result, not based on
// anything principled.
const getGamma = () => !isLWorAF() ? 1.24 : 1.5;

const applyInversionBias = (color: number) => (
  !isLWorAF()
    ? ((0.92 * color) + 0.08)
    : color
);

const invertChannel = (channel: number) => {
  const linearized = Math.pow(channel, getGamma());
  const invertedLinearized = 1.0-linearized;
  const inverted = Math.pow(invertedLinearized, 1.0 / getGamma());
  return applyInversionBias(inverted);
}

export function invertColor(color: ColorTuple): ColorTuple
{
  const [r,g,b,a] = color;
  return [invertChannel(r),invertChannel(g),invertChannel(b),1];
}

function validateColor(color: ColorTuple) {
  const [r,g,b,a] = color;
  if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1 || a < 0 || a > 1) {
    throw new Error(`Invalid color: ${color}`);
  }
}

export function invertHexColor(color: string): string {
  const parsed = parseColor(color);
  validateColor(parsed!);
  const inverted = invertColor(parsed!);
  validateColor(inverted);
  return colorToString(inverted);
}

export const grey = mapValues({
  // Exactly matches @/lib/vendor/@material-ui/core/src/colors/grey
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
  A100: '#d5d5d5',
  A200: '#aaaaaa',
  A400: '#303030',
  A700: '#616161',

  // Greyscale colors not in the MUI palette
  0: "#fff",
  1000: "#000",

  10: '#fefefe',
  20: '#fdfdfd',
  25: '#fcfcfc',
  30: '#fbfbfb',
  55: '#f9f9f9',
  60: '#f8f8f8',
  110: "#f3f3f3",
  120: '#f2f2f2',
  140: "#f0f0f0",
  250: "#e8e8e8",
  310: "#dddddd",
  315: "#d4d4d4",
  320: "#d9d9d9",
  340: "#d0d0d0",
  405: "#bbbbbb",
  410: "#b3b3b3",
  550: "#999999",
  620: "#888888",
  650: "#808080",
  680: "#666666",
  710: "#606060",
  750: "#5e5e5e",
}, v => `light-dark(${v},${invertHexColor(v)})`) as ThemeGreyscale;

export const greyAlpha = (alpha: number) => `light-dark(rgba(0,0,0,${alpha}),rgba(255,255,255,${alpha}))`;
export const inverseGreyAlpha = (alpha: number) => `light-dark(rgba(255,255,255,${alpha}),rgba(0,0,0,${alpha}))`;
export const primaryAlpha = greyAlpha;
export const boxShadowColor = (alpha: number) => greyAlpha(alpha);
export const greyBorder = (thickness: string, alpha: number) => `${thickness} solid ${greyAlpha(alpha)}`;
export const invertIfDarkMode = (color: string) => `light-dark(${color},${invertHexColor(color)})`;

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from https://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * Source: https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
 */
function hslToRgb(h: number, s: number, l: number): ColorTuple {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = (l < 0.5) ? (l * (1 + s)) : (l + s - (l * s));
    const p = (2*l) - q;
    r = hueToRgb(p, q, h + (1/3));
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - (1/3));
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 1.0];
}

function hueToRgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + ((q-p) * 6 * t);
  if (t < 1/2) return q;
  if (t < 2/3) return p + ((q-p) * ((2/3) - t) * 6);
  return p;
}
