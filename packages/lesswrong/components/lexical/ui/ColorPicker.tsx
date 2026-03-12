// /**
//  * Copyright (c) Meta Platforms, Inc. and affiliates.
//  *
//  * This source code is licensed under the MIT license found in the
//  * LICENSE file in the root directory of this source tree.
//  *
//  */

// import React, { type JSX } from 'react';

// import {calculateZoomLevel} from '@lexical/utils';
// import {useMemo, useRef, useState} from 'react';


// import { defineStyles, useStyles } from '@/components/hooks/useStyles';
// import {isKeyboardInput} from '../utils/focusUtils';
// import TextInput from './TextInput';

// const styles = defineStyles('LexicalColorPicker', (theme: ThemeType) => ({
//   wrapper: {
//     padding: 20,
//   },
//   basicColor: {
//     display: 'flex',
//     flexWrap: 'wrap',
//     gap: 10,
//     margin: 0,
//     padding: 0,
//     '& button': {
//       border: `1px solid ${theme.palette.grey[310]}`,
//       borderRadius: 4,
//       height: 16,
//       width: 16,
//       cursor: 'pointer',
//       listStyleType: 'none',
//     },
//     '& button.active': {
//       boxShadow: `0px 0px 2px 2px ${theme.palette.greyAlpha(0.3)}`,
//     },
//   },
//   saturation: {
//     width: '100%',
//     position: 'relative',
//     marginTop: 15,
//     height: 150,
//     backgroundImage: `linear-gradient(transparent, ${theme.palette.grey[1000]}), linear-gradient(to right, ${theme.palette.grey[0]}, transparent)`,
//     userSelect: 'none',
//   },
//   saturationCursor: {
//     position: 'absolute',
//     width: 20,
//     height: 20,
//     border: `2px solid ${theme.palette.grey[0]}`,
//     borderRadius: '50%',
//     boxShadow: `0 0 15px ${theme.palette.greyAlpha(0.15)}`,
//     boxSizing: 'border-box',
//     transform: 'translate(-10px, -10px)',
//   },
//   hue: {
//     width: '100%',
//     position: 'relative',
//     marginTop: 15,
//     height: 12,
//     backgroundImage: 'linear-gradient(to right, rgb(255, 0, 0), rgb(255, 255, 0), rgb(0, 255, 0), rgb(0, 255, 255), rgb(0, 0, 255), rgb(255, 0, 255), rgb(255, 0, 0))',
//     userSelect: 'none',
//     borderRadius: 12,
//   },
//   hueCursor: {
//     position: 'absolute',
//     width: 20,
//     height: 20,
//     border: `2px solid ${theme.palette.grey[0]}`,
//     borderRadius: '50%',
//     boxShadow: `${theme.palette.greyAlpha(0.2)} 0 0 0 0.5px`,
//     boxSizing: 'border-box',
//     transform: 'translate(-10px, -4px)',
//   },
//   color: {
//     border: `1px solid ${theme.palette.grey[310]}`,
//     marginTop: 15,
//     width: '100%',
//     height: 20,
//   },
// }));

// let skipAddingToHistoryStack = false;

// interface ColorPickerProps {
//   color: string;
//   onChange?: (
//     value: string,
//     skipHistoryStack: boolean,
//     skipRefocus: boolean,
//   ) => void;
// }

// export function parseAllowedColor(input: string) {
//   return /^rgb\(\d+, \d+, \d+\)$/.test(input) ? input : '';
// }

// const basicColors = [
//   '#d0021b',
//   '#f5a623',
//   '#f8e71c',
//   '#8b572a',
//   '#7ed321',
//   '#417505',
//   '#bd10e0',
//   '#9013fe',
//   '#4a90e2',
//   '#50e3c2',
//   '#b8e986',
//   '#000000',
//   '#4a4a4a',
//   '#9b9b9b',
//   '#ffffff',
// ];

// const WIDTH = 214;
// const HEIGHT = 150;

// export default function ColorPicker({
//   color,
//   onChange,
// }: Readonly<ColorPickerProps>): JSX.Element {
//   const classes = useStyles(styles);
//   const [selfColor, setSelfColor] = useState(transformColor('hex', color));
//   const [inputColor, setInputColor] = useState(
//     transformColor('hex', color).hex,
//   );
//   const innerDivRef = useRef(null);

//   const saturationPosition = useMemo(
//     () => ({
//       x: (selfColor.hsv.s / 100) * WIDTH,
//       y: ((100 - selfColor.hsv.v) / 100) * HEIGHT,
//     }),
//     [selfColor.hsv.s, selfColor.hsv.v],
//   );

//   const huePosition = useMemo(
//     () => ({
//       x: (selfColor.hsv.h / 360) * WIDTH,
//     }),
//     [selfColor.hsv],
//   );

//   const emitOnChange = (newColor: string, skipRefocus: boolean = false) => {
//     // Check if the dropdown is actually active
//     if (innerDivRef.current !== null && onChange) {
//       onChange(newColor, skipAddingToHistoryStack, skipRefocus);
//     }
//   };

//   const onSetHex = (hex: string) => {
//     setInputColor(hex);
//     if (/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
//       const newColor = transformColor('hex', hex);
//       setSelfColor(newColor);
//       emitOnChange(newColor.hex);
//     }
//   };

//   const onMoveSaturation = ({x, y}: Position) => {
//     const newHsv = {
//       ...selfColor.hsv,
//       s: (x / WIDTH) * 100,
//       v: 100 - ((y / HEIGHT) * 100),
//     };
//     const newColor = transformColor('hsv', newHsv);
//     setSelfColor(newColor);
//     setInputColor(newColor.hex);
//     emitOnChange(newColor.hex);
//   };

//   const onMoveHue = ({x}: Position) => {
//     const newHsv = {...selfColor.hsv, h: (x / WIDTH) * 360};
//     const newColor = transformColor('hsv', newHsv);

//     setSelfColor(newColor);
//     setInputColor(newColor.hex);
//     emitOnChange(newColor.hex);
//   };

//   const onBasicColorClick = (e: React.MouseEvent, basicColor: string) => {
//     const newColor = transformColor('hex', basicColor);

//     setSelfColor(newColor);
//     setInputColor(newColor.hex);
//     emitOnChange(newColor.hex, isKeyboardInput(e));
//   };

//   return (
//     <div
//       className={classes.wrapper}
//       style={{width: WIDTH}}
//       ref={innerDivRef}>
//       <TextInput label="Hex" onChange={onSetHex} value={inputColor} />
//       <div className={classes.basicColor}>
//         {basicColors.map((basicColor) => (
//           <button
//             className={basicColor === selfColor.hex ? 'active' : ''}
//             key={basicColor}
//             style={{backgroundColor: basicColor}}
//             onClick={(e) => onBasicColorClick(e, basicColor)}
//           />
//         ))}
//       </div>
//       <MoveWrapper
//         className={classes.saturation}
//         style={{backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)`}}
//         onChange={onMoveSaturation}>
//         <div
//           className={classes.saturationCursor}
//           style={{
//             backgroundColor: selfColor.hex,
//             left: saturationPosition.x,
//             top: saturationPosition.y,
//           }}
//         />
//       </MoveWrapper>
//       <MoveWrapper className={classes.hue} onChange={onMoveHue}>
//         <div
//           className={classes.hueCursor}
//           style={{
//             backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)`,
//             left: huePosition.x,
//           }}
//         />
//       </MoveWrapper>
//       <div
//         className={classes.color}
//         style={{backgroundColor: selfColor.hex}}
//       />
//     </div>
//   );
// }

// export interface Position {
//   x: number;
//   y: number;
// }

// interface MoveWrapperProps {
//   className?: string;
//   style?: React.CSSProperties;
//   onChange: (position: Position) => void;
//   children: JSX.Element;
// }

// function MoveWrapper({className, style, onChange, children}: MoveWrapperProps) {
//   const divRef = useRef<HTMLDivElement>(null);
//   const draggedRef = useRef(false);

//   const move = (e: React.MouseEvent | MouseEvent): void => {
//     if (divRef.current) {
//       const {current: div} = divRef;
//       const {width, height, left, top} = div.getBoundingClientRect();
//       const zoom = calculateZoomLevel(div);
//       const x = clamp((e.clientX / zoom) - left, width, 0);
//       const y = clamp((e.clientY / zoom) - top, height, 0);

//       onChange({x, y});
//     }
//   };

//   const onMouseDown = (e: React.MouseEvent): void => {
//     if (e.button !== 0) {
//       return;
//     }

//     move(e);

//     const onMouseMove = (_e: MouseEvent): void => {
//       draggedRef.current = true;
//       skipAddingToHistoryStack = true;
//       move(_e);
//     };

//     const onMouseUp = (_e: MouseEvent): void => {
//       if (draggedRef.current) {
//         skipAddingToHistoryStack = false;
//       }

//       document.removeEventListener('mousemove', onMouseMove, false);
//       document.removeEventListener('mouseup', onMouseUp, false);

//       move(_e);
//       draggedRef.current = false;
//     };

//     document.addEventListener('mousemove', onMouseMove, false);
//     document.addEventListener('mouseup', onMouseUp, false);
//   };

//   return (
//     <div
//       ref={divRef}
//       className={className}
//       style={style}
//       onMouseDown={onMouseDown}>
//       {children}
//     </div>
//   );
// }

// function clamp(value: number, max: number, min: number) {
//   return value > max ? max : value < min ? min : value;
// }

// interface RGB {
//   b: number;
//   g: number;
//   r: number;
// }
// interface HSV {
//   h: number;
//   s: number;
//   v: number;
// }
// interface Color {
//   hex: string;
//   hsv: HSV;
//   rgb: RGB;
// }

// export function toHex(value: string): string {
//   if (!value.startsWith('#')) {
//     const ctx = document.createElement('canvas').getContext('2d');

//     if (!ctx) {
//       throw new Error('2d context not supported or canvas already initialized');
//     }

//     ctx.fillStyle = value;

//     return ctx.fillStyle;
//   } else if (value.length === 4 || value.length === 5) {
//     value = value
//       .split('')
//       .map((v, i) => (i ? v + v : '#'))
//       .join('');

//     return value;
//   } else if (value.length === 7 || value.length === 9) {
//     return value;
//   }

//   return '#000000';
// }

// function hex2rgb(hex: string): RGB {
//   const rbgArr = (
//     hex
//       .replace(
//         /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
//         (m, r, g, b) => '#' + r + r + g + g + b + b,
//       )
//       .substring(1)
//       .match(/.{2}/g) || []
//   ).map((x) => parseInt(x, 16));

//   return {
//     b: rbgArr[2],
//     g: rbgArr[1],
//     r: rbgArr[0],
//   };
// }

// function rgb2hsv({r, g, b}: RGB): HSV {
//   r /= 255;
//   g /= 255;
//   b /= 255;

//   const max = Math.max(r, g, b);
//   const d = max - Math.min(r, g, b);

//   const h = d
//     ? (max === r
//         ? ((g - b) / d) + (g < b ? 6 : 0)
//         : max === g
//           ? 2 + ((b - r) / d)
//           : 4 + ((r - g) / d)) * 60
//     : 0;
//   const s = max ? (d / max) * 100 : 0;
//   const v = max * 100;

//   return {h, s, v};
// }

// function hsv2rgb({h, s, v}: HSV): RGB {
//   s /= 100;
//   v /= 100;

//   const i = ~~(h / 60);
//   const f = (h / 60) - i;
//   const p = v * (1 - s);
//   const q = v * (1 - (s * f));
//   const t = v * (1 - (s * (1 - f)));
//   const index = i % 6;

//   const r = Math.round([v, q, p, p, t, v][index] * 255);
//   const g = Math.round([t, v, v, q, p, p][index] * 255);
//   const b = Math.round([p, p, t, v, v, q][index] * 255);

//   return {b, g, r};
// }

// function rgb2hex({b, g, r}: RGB): string {
//   return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
// }

// function transformColor<M extends keyof Color, C extends Color[M]>(
//   format: M,
//   color: C,
// ): Color {
//   let hex: Color['hex'] = toHex('#121212');
//   let rgb: Color['rgb'] = hex2rgb(hex);
//   let hsv: Color['hsv'] = rgb2hsv(rgb);

//   if (format === 'hex') {
//     const value = color as Color['hex'];

//     hex = toHex(value);
//     rgb = hex2rgb(hex);
//     hsv = rgb2hsv(rgb);
//   } else if (format === 'rgb') {
//     const value = color as Color['rgb'];

//     rgb = value;
//     hex = rgb2hex(rgb);
//     hsv = rgb2hsv(rgb);
//   } else if (format === 'hsv') {
//     const value = color as Color['hsv'];

//     hsv = value;
//     rgb = hsv2rgb(hsv);
//     hex = rgb2hex(rgb);
//   }

//   return {hex, hsv, rgb};
// }
