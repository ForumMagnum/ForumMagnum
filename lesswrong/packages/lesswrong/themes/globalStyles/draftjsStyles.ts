import { isFriendlyUI } from "../forumTheme";

const draftJsButtonFontWeight = isFriendlyUI ? 600 : "inherit";

//
// Styles used by DraftJS and its plugins. It's unclear which of these are
// actually in use.
//
export default (): string => `
/**
 * Draft v0.10.5
 *
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
.DraftEditor-editorContainer,.DraftEditor-root,.public-DraftEditor-content{height:inherit;text-align:initial}.public-DraftEditor-content[contenteditable=true]{-webkit-user-modify:read-write-plaintext-only}.DraftEditor-root{position:relative}.DraftEditor-editorContainer{background-color:rgba(255,255,255,0);border-left:.1px solid transparent;position:relative;z-index:1}.public-DraftEditor-block{position:relative}.DraftEditor-alignLeft .public-DraftStyleDefault-block{text-align:left}.DraftEditor-alignLeft .public-DraftEditorPlaceholder-root{left:0;text-align:left}.DraftEditor-alignCenter .public-DraftStyleDefault-block{text-align:center}.DraftEditor-alignCenter .public-DraftEditorPlaceholder-root{margin:0 auto;text-align:center;width:100%}.DraftEditor-alignRight .public-DraftStyleDefault-block{text-align:right}.DraftEditor-alignRight .public-DraftEditorPlaceholder-root{right:0;text-align:right}.public-DraftEditorPlaceholder-root{color:#9197a3;position:absolute;z-index:1}.public-DraftEditorPlaceholder-hasFocus{color:#bdc1c9}.DraftEditorPlaceholder-hidden{display:none}.public-DraftStyleDefault-block{position:relative;white-space:pre-wrap}.public-DraftStyleDefault-ltr{direction:ltr;text-align:left}.public-DraftStyleDefault-rtl{direction:rtl;text-align:right}.public-DraftStyleDefault-listLTR{direction:ltr}.public-DraftStyleDefault-listRTL{direction:rtl}.public-DraftStyleDefault-ol,.public-DraftStyleDefault-ul{margin:16px 0;padding:0}.public-DraftStyleDefault-depth0.public-DraftStyleDefault-listLTR{margin-left:1.5em}.public-DraftStyleDefault-depth0.public-DraftStyleDefault-listRTL{margin-right:1.5em}.public-DraftStyleDefault-depth1.public-DraftStyleDefault-listLTR{margin-left:3em}.public-DraftStyleDefault-depth1.public-DraftStyleDefault-listRTL{margin-right:3em}.public-DraftStyleDefault-depth2.public-DraftStyleDefault-listLTR{margin-left:4.5em}.public-DraftStyleDefault-depth2.public-DraftStyleDefault-listRTL{margin-right:4.5em}.public-DraftStyleDefault-depth3.public-DraftStyleDefault-listLTR{margin-left:6em}.public-DraftStyleDefault-depth3.public-DraftStyleDefault-listRTL{margin-right:6em}.public-DraftStyleDefault-depth4.public-DraftStyleDefault-listLTR{margin-left:7.5em}.public-DraftStyleDefault-depth4.public-DraftStyleDefault-listRTL{margin-right:7.5em}.public-DraftStyleDefault-unorderedListItem{list-style-type:square;position:relative}.public-DraftStyleDefault-unorderedListItem.public-DraftStyleDefault-depth0{list-style-type:disc}.public-DraftStyleDefault-unorderedListItem.public-DraftStyleDefault-depth1{list-style-type:circle}.public-DraftStyleDefault-orderedListItem{list-style-type:none;position:relative}.public-DraftStyleDefault-orderedListItem.public-DraftStyleDefault-listLTR:before{left:-36px;position:absolute;text-align:right;width:30px}.public-DraftStyleDefault-orderedListItem.public-DraftStyleDefault-listRTL:before{position:absolute;right:-36px;text-align:left;width:30px}.public-DraftStyleDefault-orderedListItem:before{content:counter(ol0) ". ";counter-increment:ol0}.public-DraftStyleDefault-orderedListItem.public-DraftStyleDefault-depth1:before{content:counter(ol1) ". ";counter-increment:ol1}.public-DraftStyleDefault-orderedListItem.public-DraftStyleDefault-depth2:before{content:counter(ol2) ". ";counter-increment:ol2}.public-DraftStyleDefault-orderedListItem.public-DraftStyleDefault-depth3:before{content:counter(ol3) ". ";counter-increment:ol3}.public-DraftStyleDefault-orderedListItem.public-DraftStyleDefault-depth4:before{content:counter(ol4) ". ";counter-increment:ol4}.public-DraftStyleDefault-depth0.public-DraftStyleDefault-reset{counter-reset:ol0}.public-DraftStyleDefault-depth1.public-DraftStyleDefault-reset{counter-reset:ol1}.public-DraftStyleDefault-depth2.public-DraftStyleDefault-reset{counter-reset:ol2}.public-DraftStyleDefault-depth3.public-DraftStyleDefault-reset{counter-reset:ol3}.public-DraftStyleDefault-depth4.public-DraftStyleDefault-reset{counter-reset:ol4}

/* draft-js-inline-toolbar-plugin/lib/plugin.css */
.draftJsToolbar__buttonWrapper__1Dmqh {
  display: inline-block;
}

.draftJsToolbar__button__qi1gf {
  background: #fbfbfb;
  color: #888;
  font-size: 18px;
  border: 0;
  padding-top: 5px;
  vertical-align: bottom;
  height: 34px;
  width: 36px;
}

.draftJsToolbar__button__qi1gf svg {
  fill: #888;
}

.draftJsToolbar__button__qi1gf:hover, .draftJsToolbar__button__qi1gf:focus {
  background: #f3f3f3;
  outline: 0; /* reset for :focus */
}

.draftJsToolbar__active__3qcpF {
  background: #efefef;
  color: #444;
}

.draftJsToolbar__active__3qcpF svg {
  fill: #444;
}
.draftJsToolbar__separator__3U7qt {
  display: inline-block;
  border-right: 1px solid #ddd;
  height: 24px;
  margin: 0 0.5em;
}
.draftJsToolbar__toolbar__dNtBH {
  left: 50%;
  -webkit-transform: translate(-50%) scale(0);
          transform: translate(-50%) scale(0);
  position: absolute;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 2px;
  box-shadow: 0px 1px 3px 0px rgba(220,220,220,1);
  z-index: 2;
  box-sizing: border-box;
}

.draftJsToolbar__toolbar__dNtBH:after, .draftJsToolbar__toolbar__dNtBH:before {
  top: 100%;
  left: 50%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}

.draftJsToolbar__toolbar__dNtBH:after {
  border-color: rgba(255, 255, 255, 0);
  border-top-color: #fff;
  border-width: 4px;
  margin-left: -4px;
}
.draftJsToolbar__toolbar__dNtBH:before {
  border-color: rgba(221, 221, 221, 0);
  border-top-color: #ddd;
  border-width: 6px;
  margin-left: -6px;
}

/* draft-js-alignment-plugin/lib/plugin.css */
.draftJsEmojiPlugin__alignmentTool__2mkQr {
  left: 50%;
  -webkit-transform: translate(-50%) scale(0);
          transform: translate(-50%) scale(0);
  position: absolute;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 2px;
  box-shadow: 0px 1px 3px 0px rgba(220,220,220,1);
  z-index: 2;
  box-sizing: border-box;
}

.draftJsEmojiPlugin__alignmentTool__2mkQr:after, .draftJsEmojiPlugin__alignmentTool__2mkQr:before {
  top: 100%;
  left: 50%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}

.draftJsEmojiPlugin__alignmentTool__2mkQr:after {
  border-color: rgba(255, 255, 255, 0);
  border-top-color: #fff;
  border-width: 4px;
  margin-left: -4px;
}
.draftJsEmojiPlugin__alignmentTool__2mkQr:before {
  border-color: rgba(221, 221, 221, 0);
  border-top-color: #ddd;
  border-width: 6px;
  margin-left: -6px;
}
.draftJsEmojiPlugin__buttonWrapper__1Dmqh {
  display: inline-block;
}

.draftJsEmojiPlugin__button__qi1gf {
  background: #fbfbfb;
  color: #888;
  font-size: 18px;
  border: 0;
  padding-top: 5px;
  vertical-align: bottom;
  height: 34px;
  width: 36px;
}

.draftJsEmojiPlugin__button__qi1gf svg {
  fill: #888;
}

.draftJsEmojiPlugin__button__qi1gf:hover, .draftJsEmojiPlugin__button__qi1gf:focus {
  background: #f3f3f3;
  outline: 0; /* reset for :focus */
}

.draftJsEmojiPlugin__active__3qcpF {
  background: #efefef;
  color: #444;
}

.draftJsEmojiPlugin__active__3qcpF svg {
  fill: #444;
}

/* draft-js-focus-plugin/lib/plugin.css */
.draftJsFocusPlugin__unfocused__1Wvrs:hover {
  cursor: default;
  border-radius: 2px;
  box-shadow: 0 0 0 3px #D2E3F7;
}

.draftJsFocusPlugin__focused__3Mksn {
  cursor: default;
  border-radius: 2px;
  box-shadow: 0 0 0 3px #ACCEF7;
}

/* draft-js-divider-plugin/lib/plugin.css */
.draftJsDividerPlugin__buttonWrapper__1Dmqh {
  display: inline-block;
}

.draftJsDividerPlugin__button__qi1gf {
  background: #fbfbfb;
  color: #888;
  font-size: 18px;
  border: 0;
  padding-top: 5px;
  vertical-align: bottom;
  height: 34px;
  width: 36px;
}

.draftJsDividerPlugin__button__qi1gf svg {
  fill: #888;
}

.draftJsDividerPlugin__button__qi1gf:hover,
.draftJsDividerPlugin__button__qi1gf:focus {
  background: #f3f3f3;
  outline: 0; /* reset for :focus */
}

.draftJsDividerPlugin__active__3qcpF {
  background: #efefef;
  color: #444;
}

.draftJsDividerPlugin__active__3qcpF svg {
  fill: #444;
}

.draftJsDividerPlugin__separator__3M3L7 {
  display: inline-block;
  border-right: 1px solid #ddd;
  height: 24px;
  margin: 0 0.5em;
}
.draftJsDividerPlugin__dividerBlock__4VxnL {
  display: -webkit-box;
  display: flex;
  -webkit-box-align: center;
          align-items: center;
  -webkit-box-pack: center;
          justify-content: center;
  width: 100%;
  height: 100%;
  margin: 32px 0;
  border: none; /* strip default hr styling */
  text-align: center;
}

.draftJsDividerPlugin__dividerBlock__4VxnL::after {
  margin-left: 48px;
  color: rgba(0, 0, 0, 0.26); /* pick a color */
  font-size: 2.125rem;
  letter-spacing: 48px; /* increase space between dots */
  content: '\u2022\u2022\u2022';
}

:root {
  --draftjs-button-font-weight: ${draftJsButtonFontWeight};
}
`;
