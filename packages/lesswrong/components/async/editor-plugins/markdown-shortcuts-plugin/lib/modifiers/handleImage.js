'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _insertImage = require('./insertImage');

var _insertImage2 = _interopRequireDefault(_insertImage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var handleImage = function handleImage(editorState, character) {
  var re = /!\[([^\]]*)]\(([^)"]+)(?: "([^"]+)")?\)/g;
  var key = editorState.getSelection().getStartKey();
  var text = editorState.getCurrentContent().getBlockForKey(key).getText();
  var line = '' + text + character;
  var newEditorState = editorState;
  var matchArr = void 0;
  do {
    matchArr = re.exec(line);
    if (matchArr) {
      newEditorState = (0, _insertImage2.default)(newEditorState, matchArr);
    }
  } while (matchArr);
  return newEditorState;
};

exports.default = handleImage;