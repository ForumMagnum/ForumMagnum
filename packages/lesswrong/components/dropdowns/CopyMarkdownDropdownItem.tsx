import React from 'react';
import DropdownItem from './DropdownItem';
import { useMessages } from '../common/withMessages';

const CopyMarkdownDropdownItem = ({path}: {
  path: string,
}) => {
  const { flash } = useMessages();

  const copyMarkdown = () => {
    // Start synchronously, while doc still has focus and user activation - opening new tab takes focus away
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
