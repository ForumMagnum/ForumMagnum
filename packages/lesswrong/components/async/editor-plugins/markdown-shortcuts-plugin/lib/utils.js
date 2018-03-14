'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addText = addText;
exports.replaceText = replaceText;

var _draftJs = require('draft-js');

function addText(editorState, bufferText) {
  var contentState = _draftJs.Modifier.insertText(editorState.getCurrentContent(), editorState.getSelection(), bufferText);
  return _draftJs.EditorState.push(editorState, contentState, 'insert-characters');
}

function replaceText(editorState, bufferText) {
  var contentState = _draftJs.Modifier.replaceText(editorState.getCurrentContent(), editorState.getSelection(), bufferText);
  return _draftJs.EditorState.push(editorState, contentState, 'insert-characters');
}