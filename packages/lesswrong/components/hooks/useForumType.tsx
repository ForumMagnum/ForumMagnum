"use client";

import React, { createContext, useContext } from 'react';
import type { ForumTypeString } from '@/lib/instanceSettings';

const ForumTypeContext = createContext<ForumTypeString | null>(null);

export const ForumTypeProvider = ({ forumType, children }: {
  forumType: ForumTypeString,
  children: React.ReactNode,
}) => {
  return <ForumTypeContext.Provider value={forumType}>
    {children}
  </ForumTypeContext.Provider>;
};

export function useForumType() {
  const forumType = useContext(ForumTypeContext);
  if (forumType === null) {
    throw new Error('useForumType must be used within a ForumTypeProvider');
  }

  return {
    isLW: forumType === 'LessWrong',
    isAF: forumType === 'AlignmentForum',
    forumType,
  };
}
