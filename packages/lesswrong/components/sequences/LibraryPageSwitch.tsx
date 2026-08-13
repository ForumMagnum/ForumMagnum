"use client";

import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { userHasLibraryPageRedesign } from '../../lib/betas';
import LibraryPage from './LibraryPage';
import LibraryRedesignPage from './LibraryRedesignPage';

/**
 * Chooses between the old library page and the in-progress redesign, which is
 * feature-flagged while it's being iterated on.
 */
const LibraryPageSwitch = () => {
  const currentUser = useCurrentUser();

  return userHasLibraryPageRedesign(currentUser)
    ? <LibraryRedesignPage />
    : <LibraryPage />;
};

export default LibraryPageSwitch;
