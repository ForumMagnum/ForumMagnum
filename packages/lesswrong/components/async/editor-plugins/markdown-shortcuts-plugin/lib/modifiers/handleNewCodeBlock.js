'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _changeCurrentBlockType = require('./changeCurrentBlockType');

var _changeCurrentBlockType2 = _interopRequireDefault(_changeCurrentBlockType);

var _insertEmptyBlock = require('./insertEmptyBlock');

var _insertEmptyBlock2 = _interopRequireDefault(_insertEmptyBlock);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var handleNewCodeBlock = function handleNewCodeBlock(editorState) {
  var contentState = editorState.getCurrentContent();
  var selection = editorState.getSelection();
  var key = selection.getStartKey();
  var currentBlock = contentState.getBlockForKey(key);
  var matchData = /^```([\w-]+)?$/.exec(currentBlock.getText());
  var isLast = selection.getEndOffset() === currentBlock.getLength();
  if (matchData && isLast) {
    var data = {};
    var language = matchData[1];
    if (language) {
      data.language = language;
    }
    return (0, _changeCurrentBlockType2.default)(editorState, 'code-block', '', data);
  }
  var type = currentBlock.getType();
  if (type === 'code-block' && isLast) {
    return (0, _insertEmptyBlock2.default)(editorState, 'code-block', currentBlock.getData());
  }
  return editorState;
};

exports.default = handleNewCodeBlock;