"use client";
import {BlockWithAlignableContents} from '@lexical/react/LexicalBlockWithAlignableContents';

export const BlockWithAlignableContentsWrapper = ({children, ...props}: BlockWithAlignableContentsProps) => {
  return (
    <BlockWithAlignableContents {...props}>
      {children}
    </BlockWithAlignableContents>
  );
};