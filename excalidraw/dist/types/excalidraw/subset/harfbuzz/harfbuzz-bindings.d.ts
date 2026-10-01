/**
 * Modified version of hb-subset bindings from "subset-font" package https://github.com/papandreou/subset-font/blob/3f711c8aa29a426c7f22655861abfb976950f527/index.js
 *
 * CHANGELOG:
 * - removed dependency on node APIs to work inside the browser
 * - removed dependency on font fontverter for brotli compression
 * - removed dependencies on lodash and p-limit
 * - removed options for preserveNameIds, variationAxes, noLayoutClosure (not needed for now)
 * - replaced text input with codepoints
 * - rewritten in typescript and with esm modules

Copyright (c) 2012, Andreas Lind Petersen
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in
    the documentation and/or other materials provided with the
    distribution.
  * Neither the name of the author nor the names of contributors may
    be used to endorse or promote products derived from this
    software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
declare function subset(hbSubsetWasm: any, heapu8: Uint8Array, font: ArrayBuffer, codePoints: ReadonlySet<number>): Uint8Array<ArrayBuffer>;
declare const _default: {
    subset: typeof subset;
};
export default _default;
