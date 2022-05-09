
export function invertHexColor(color: string): string {
  function fromHexDigit(s: string, offset: number): number {
    let ch = s.charCodeAt(offset);
    if (ch>=48 && ch<58) return ch-48; //'0'-'9'
    else if (ch>=97 && ch<=102) return ch-97+10; //'a'-'f'
    else if (ch>=65 && ch<=70) return ch-65+10; //'A'-'F'
    else return 0;
  }
  function parseHexColor(color: string): [number,number,number] {
    const r = (fromHexDigit(color,1)*16) + fromHexDigit(color,2);
    const g = (fromHexDigit(color,3)*16) + fromHexDigit(color,4);
    const b = (fromHexDigit(color,5)*16) + fromHexDigit(color,6);
    return [r,g,b];
  }
  function toHexDigit(n: number) {
    if (n<10) return String.fromCharCode(48+n);
    else return String.fromCharCode(87+n);
  }
  function toHex2(n: number) {
    return toHexDigit(n/16)+toHexDigit(n%16);
  }
  function toHexColor(r: number, g: number, b: number) {
    return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
  }
  
  // Parse and convert to RGB
  const [r,g,b] = parseHexColor(color);
  // Convert into linear color space
  // HACK: Gamma here is tuned empirically for a visual result, not based on
  // anything principled.
  const gamma=1.5;
  const linR = Math.pow(r,gamma);
  const linG = Math.pow(g,gamma);
  const linB = Math.pow(b,gamma);
  // Invert
  const invLinR = Math.pow(255,gamma)-linR;
  const invLinG = Math.pow(255,gamma)-linG;
  const invLinB = Math.pow(255,gamma)-linB;
  // Convert back into gamma color space
  const invR = Math.round(Math.pow(invLinR, 1/gamma));
  const invG = Math.round(Math.pow(invLinG, 1/gamma));
  const invB = Math.round(Math.pow(invLinB, 1/gamma));
  return toHexColor(invR,invG,invB);
}
