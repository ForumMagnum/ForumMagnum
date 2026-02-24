"use client";
import {BlockWithAlignableContents} from '@lexical/react/LexicalBlockWithAlignableContents';

export const BlockWithAlignableContentsWrapper: typeof BlockWithAlignableContents = ({children, ...props}) => {
  return (
    <BlockWithAlignableContents {...props}>
      {children}
    </BlockWithAlignableContents>
  );
};
