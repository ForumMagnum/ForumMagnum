import React from 'react';
import DropdownItem from './DropdownItem';
import { useMessages } from '../common/withMessages';

/**
 * Menu item that opens the markdown API page for a post or comment in a new
 * tab, and copies its markdown to the clipboard.
 */
const CopyMarkdownDropdownItem = ({path}: {
  path: string,
}) => {
  const { flash } = useMessages();

  const copyMarkdown = async () => {
    // window.open must happen before any await, or popup blockers will eat it
    window.open(path, '_blank');
    const response = await fetch(path);
    if (!response.ok) {
      flash("Failed to fetch markdown");
      return;
    }
    await navigator.clipboard.writeText(await response.text());
    flash("Markdown copied to clipboard");
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
