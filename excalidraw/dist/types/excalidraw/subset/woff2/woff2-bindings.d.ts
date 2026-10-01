/**
 * Slitghly modified emscripten bindings of https://github.com/kekee000/fonteditor-core/blob/582bba757aa2915ec2240c61717ff12c50594675/woff2src/woff2.js
 *
 * CHANGELOG:
 * - replaced existing exports with default esm export (`export default Module;`)
 * - replaced "instanceof ArrayBuffer" with "Object.prototype.toString.call(d) === "[object ArrayBuffer]", due to unreliability of different ArrayBuffer instances depending on the context (i.e. inside VM)

The MIT License (MIT)

Copyright (c) 2014 ecomfe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
declare const Module: (Module: any) => any;
export default Module;
