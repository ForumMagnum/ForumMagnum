import { useEffect } from 'react';
import {
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_HIGH,
  TextNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// Underline is bit flag 1 << 3 = 8 in Lexical's internal format representation
const IS_UNDERLINE = 8;

function stripUnderlineFromNode(node: TextNode): void {
  const format = node.getFormat();
  if (format & IS_UNDERLINE) {
    node.setFormat(format & ~IS_UNDERLINE);
  }
}

export default function DisableUnderlinePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Intercept FORMAT_TEXT_COMMAND to block underline toggling
    const unregisterCommand = editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (payload) => {
        if (payload === 'underline') {
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );

    // Strip underline from any text node that enters the editor (paste, conversion, etc.)
    const unregisterTransform = editor.registerNodeTransform(TextNode, stripUnderlineFromNode);

    return () => {
      unregisterCommand();
      unregisterTransform();
    };
  }, [editor]);

  return null;
}
