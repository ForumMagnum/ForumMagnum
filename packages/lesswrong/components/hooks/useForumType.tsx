"use client";

import React, { createContext, useContext } from 'react';
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import type { ForumTypeString } from '@/lib/instanceSettings';

const ForumTypeContext = createContext<ForumTypeString | null>(null);

export const ForumTypeProvider = ({ children }: {
  children: React.ReactNode,
}) => {
  // Keep the existing setting as the source until forum type is supplied per request.
  return <ForumTypeContext.Provider value={forumTypeSetting.get()}>
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
