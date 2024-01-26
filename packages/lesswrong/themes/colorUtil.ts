import { isLWorAF } from "../lib/instanceSettings";

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
const GAMMA = !isLWorAF ? 1.24 : 1.5;

const applyInversionBias = !isLWorAF
  ? (color: number) => (0.92 * color) + 0.08
  : (color: number) => color;

const invertChannel = (channel: number) => {
  const linearized = Math.pow(channel, GAMMA);
  const invertedLinearized = 1.0-linearized;
  const inverted = Math.pow(invertedLinearized, 1.0 / GAMMA);
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
