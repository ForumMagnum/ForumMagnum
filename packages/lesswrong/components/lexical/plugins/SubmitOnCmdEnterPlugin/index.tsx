import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_HIGH, KEY_DOWN_COMMAND } from 'lexical';

function isSubmitKeystroke(event: KeyboardEvent): boolean {
  return event.key === 'Enter' && (event.metaKey || event.ctrlKey);
}

function handleSubmitKeystroke(event: KeyboardEvent): boolean {
  if (event.isComposing || !isSubmitKeystroke(event)) {
    return false;
  }
  event.preventDefault();
  return true;
}

export default function SubmitOnCmdEnterPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      handleSubmitKeystroke,
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}
