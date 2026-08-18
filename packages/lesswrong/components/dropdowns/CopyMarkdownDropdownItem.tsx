import React, { useState } from 'react';
import DropdownItem from './DropdownItem';
import { useMessages } from '../common/withMessages';

const CopyMarkdownDropdownItem = ({path}: {
  path: string,
}) => {
  const { flash } = useMessages();
  const [loading, setLoading] = useState(false);

  const copyMarkdown = () => {
    // Pass the fetch promise into ClipboardItem rather than awaiting it first,
    // so the clipboard write still counts as user-activated in Safari
    setLoading(true);
    const markdownBlob = fetch(path).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status}`);
      }
      return new Blob([await response.text()], {type: "text/plain"});
    });
    navigator.clipboard.write([
      new ClipboardItem({"text/plain": markdownBlob}),
    ]).then(
      () => flash("Markdown copied to clipboard"),
      () => flash("Failed to copy markdown"),
    ).finally(() => setLoading(false));
  };

  return (
    <DropdownItem
      title="Copy Markdown"
      icon="ClipboardDocument"
      onClick={copyMarkdown}
      loading={loading}
    />
  );
};

export default CopyMarkdownDropdownItem;
