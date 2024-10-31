//
// truncatise, by Marcus Noble. Forked from
// https://github.com/AverageMarcus/Truncatise
//
// The MIT License (MIT)
//
// Copyright (c) 2013 Marcus Noble
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
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
//
"use strict";

var selfClosingTags = ["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "menuitem", "meta", "param", "source", "track", "wbr"];

interface TruncatiseOptions {
  TruncateBy?: "words"|"characters"|"paragraphs",
  TruncateLength?: number,
  Strict?: boolean,
  Suffix?: string,
}

/**
 * Truncates a given HTML string to the specified length.
 * @param {string} text This is the HTMl string to be truncated
 * @param {object} options An options object defining how to truncate
 *      Default values:
 *      {
 *          TruncateBy : 'words',   // Options are 'words', 'characters' or 'paragraphs'
 *          TruncateLength : 50,    // The count to be used with TruncatedBy
 *          Strict : true,          // When set to false the truncated text finish at the end of the word
 *          Suffix : '...'          // Text to be appended to the end of the truncated text
 *      }
 * @return {string} This returns the provided string truncated to the
 *      length provided by the options. HTML tags may be stripped based
 *      on the given options.
 */
export const truncatise = function(text: string, {TruncateBy="words", TruncateLength=50, Strict=true, Suffix="..."}: TruncatiseOptions): string {
    var text            = (text || "").trim();
    var currentState    = 0;
    var currentTagStart = 0;
    var tagStack: string[] = [];

    //Counters
    var charCounter         = 0;
    var wordCounter         = 0;
    var paragraphCounter    = 0;

    //currentState values
    const NOT_TAG = 0;
    const TAG_START = 1;
    const TAG_ATTRIBUTES = 2;

    //Set default values
    const matchByWords = TruncateBy==="words";
    const matchByCharacters = TruncateBy==="characters";
    const matchByParagraphs = TruncateBy==="paragraphs";
    
    if(text === "" || (text.length <= TruncateLength)){
        return text;
    }

    //Remove newline seperating paragraphs
    text = text.replace(/<\/p>(\r?\n)+<p>/gm, '</p><p>');

    let pointer = 0;
    for (; pointer < text.length; pointer++ ) {
      var currentChar = text.charCodeAt(pointer);

      switch(currentChar) {
        case 60: //"<"
          if(currentState === NOT_TAG){
            currentState = TAG_START;
            currentTagStart = pointer+1;
          }
          break;
        case 62: { //>
          if(currentState === TAG_START || currentState === TAG_ATTRIBUTES){
            currentState = NOT_TAG;
            
            // Get the tag
            const currentTag: string = text.substring(currentTagStart, pointer).toLowerCase();
            
            // Separate the tag name from the attributes
            const attributesStart = currentTag.indexOf(" ");
            const tagWithoutAttributes = (attributesStart >= 0) ? currentTag.substring(0, attributesStart) : currentTag;
            
            if(tagWithoutAttributes === "/p"){
              paragraphCounter++;
            }

            // Ignore self-closing tags.
            if ((selfClosingTags.indexOf(tagWithoutAttributes) === -1) && (selfClosingTags.indexOf(tagWithoutAttributes + '/') === -1)) {
              if(tagWithoutAttributes.indexOf("/") >= 0){
                tagStack.pop();
              } else {
                tagStack.push(tagWithoutAttributes);
              }
            }
          }
          break;
        }
        case 32: //' '
          if(currentState === TAG_START){
            currentState = TAG_ATTRIBUTES;
          }
          if(currentState === NOT_TAG){
            wordCounter++;
            charCounter++;
          }
          break;
        default:
          if(currentState === NOT_TAG){
            charCounter++;
          }
          break;
      }

      if(matchByWords && wordCounter >= TruncateLength){
        break;
      }
      if(matchByCharacters && TruncateLength <= charCounter) {
        if (Strict) {
          break;
        } else if(!isWordCharCode(currentChar) || ((pointer+1<text.length) && !isWordCharCode(text.charCodeAt(pointer+1)))) {
          break;
        }
      }
      if (matchByParagraphs && TruncateLength === paragraphCounter) {
        break;
      }
    }
    
    let truncatedText = text.substring(0, pointer+1);
    if(matchByWords && wordCounter >= TruncateLength){
      truncatedText = truncatedText.trimEnd();
    }

    while(tagStack.length > 0){
      var tag = tagStack.pop();
      if(tag!=="!--"){
        truncatedText += "</"+tag+">";
      }
    }

    if(pointer < text.length-1) {
      if(truncatedText.endsWith("</p>") || truncatedText.endsWith("</P>")) {
        return truncatedText.substring(0, truncatedText.length - 4) + Suffix + "</p>";
      } else {
        return truncatedText + Suffix;
      }
    } else {
      return truncatedText.trim();
    }
};

function isWordCharCode(ch: number) {
  return String.fromCharCode(ch).match(/[a-zA-ZÇ-Ü']/i);
}
