import React from 'react';
import DropdownItem from './DropdownItem';
import { useMessages } from '../common/withMessages';

const CopyMarkdownDropdownItem = ({path}: {
  path: string,
}) => {
  const { flash } = useMessages();

  const copyMarkdown = () => {
    // Start the clipboard write synchronously, while this document still has
    // focus and user activation - opening the new tab takes focus away, which
    // would make a later writeText call fail. Passing a promise to
    // ClipboardItem lets the fetch resolve after focus is gone.
    const markdownBlob = fetch(path).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status}`);
      }
      return new Blob([await response.text()], {type: "text/plain"});
    });
    const clipboardWrite = navigator.clipboard.write([
      new ClipboardItem({"text/plain": markdownBlob}),
    ]);
    window.open(path, "_blank");
    clipboardWrite.then(
      () => flash("Markdown copied to clipboard"),
      () => flash("Failed to copy markdown"),
    );
  };

  return (
    <DropdownItem
      title="Copy Markdown"
      icon="ClipboardDocument"
      onClick={copyMarkdown}
    />
  );
};

export default CopyMarkdownDropdownItem;
