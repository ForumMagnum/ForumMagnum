// color-hash by Zeno Zeng
// https://github.com/zenozeng/color-hash
//
// The MIT License (MIT)
//
// Copyright (c) 2015 Zeno Zeng
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * BKDR Hash (modified version)
 *
 * @param {String} str string to hash
 * @returns {Number}
 */
var BKDRHash = function(str: string) {
    var seed = 131;
    var seed2 = 137;
    var hash = 0;
    // make hash more sensitive for short string like 'a', 'b', 'c'
    str += 'x';
    // Note: Number.MAX_SAFE_INTEGER equals 9007199254740991
    var MAX_SAFE_INTEGER = parseInt((9007199254740991 / seed2) as any);
    for(var i = 0; i < str.length; i++) {
        if(hash > MAX_SAFE_INTEGER) {
            hash = parseInt((hash / seed2) as any);
        }
        hash = (hash*seed) + str.charCodeAt(i);
    }
    return hash;
};

/**
 * Convert RGB Array to HEX
 *
 * @param {Array} RGBArray - [R, G, B]
 * @returns {String} 6 digits hex starting with #
 */
var rgb2hex = function(RGBArray: number[]) {
    var hex = '#';
    RGBArray.forEach(function(value) {
        if (value < 16) {
            hex += 0;
        }
        hex += value.toString(16);
    });
    return hex;
};

/**
 * Convert HSL to RGB
 *
 * @see {@link http://zh.wikipedia.org/wiki/HSL和HSV色彩空间} for further information.
 * @param {Number} H Hue ∈ [0, 360)
 * @param {Number} S Saturation ∈ [0, 1]
 * @param {Number} L Lightness ∈ [0, 1]
 * @returns {Array} R, G, B ∈ [0, 255]
 */
var HSL2RGB = function(H: number, S: number, L: number) {
    H /= 360;

    var q = L < 0.5 ? (L * (1 + S)) : L + S - (L * S);
    var p = (2 * L) - q;

    return [H+(1/3), H, H-(1/3)].map(function(color: number) {
        if(color < 0) {
            color++;
        }
        if(color > 1) {
            color--;
        }
        if(color < 1/6) {
            color = p + ((q - p) * (6 * color));
        } else if(color < 0.5) {
            color = q;
        } else if(color < 2/3) {
            color = p + (((q-p) * 6) * ((2/3) - color));
        } else {
            color = p;
        }
        return Math.round(color * 255);
    });
};

function isArray(o: any): boolean {
    return Object.prototype.toString.call(o) === '[object Array]';
}

/**
 * Color Hash Class
 */
export const ColorHash: AnyBecauseTodo = function(this: AnyBecauseTodo, options: AnyBecauseTodo) {
    options = options || {};

    var LS = [options.lightness, options.saturation].map(function(param) {
        param = param !== undefined ? param : [0.35, 0.5, 0.65]; // note that 3 is a prime
        return isArray(param) ? param.concat() : [param];
    });

    this.L = LS[0];
    this.S = LS[1];

    if (typeof options.hue === 'number') {
        options.hue = {min: options.hue, max: options.hue};
    }
    if (typeof options.hue === 'object' && !isArray(options.hue)) {
        options.hue = [options.hue];
    }
    if (typeof options.hue === 'undefined') {
        options.hue = [];
    }
    this.hueRanges = options.hue.map(function (range: any) {
        return {
            min: typeof range.min === 'undefined' ? 0 : range.min,
            max: typeof range.max === 'undefined' ? 360: range.max
        };
    });

    this.hash = options.hash || BKDRHash;
};

/**
 * Returns the hash in [h, s, l].
 * Note that H ∈ [0, 360); S ∈ [0, 1]; L ∈ [0, 1];
 *
 * @param {String} str string to hash
 * @returns {Array} [h, s, l]
 */
ColorHash.prototype.hsl = function(str: string) {
    var H, S, L;
    var hash = this.hash(str);

    if (this.hueRanges.length) {
        var range = this.hueRanges[hash % this.hueRanges.length];
        var hueResolution = 727; // note that 727 is a prime
        H = ((((hash / this.hueRanges.length) % hueResolution) * (range.max - range.min)) / hueResolution) + range.min;
    } else {
        H = hash % 359; // note that 359 is a prime
    }
    hash = parseInt(hash / 360 as any);
    S = this.S[hash % this.S.length];
    hash = parseInt(hash / this.S.length as any);
    L = this.L[hash % this.L.length];

    return [H, S, L];
};

/**
 * Returns the hash in [r, g, b].
 * Note that R, G, B ∈ [0, 255]
 *
 * @param {String} str string to hash
 * @returns {Array} [r, g, b]
 */
ColorHash.prototype.rgb = function(str: string) {
    var hsl = this.hsl(str);
    return HSL2RGB.apply(this, hsl);
};

/**
 * Returns the hash in hex
 *
 * @param {String} str string to hash
 * @returns {String} hex with #
 */
ColorHash.prototype.hex = function(str: string) {
    var rgb = this.rgb(str);
    return rgb2hex(rgb);
};
