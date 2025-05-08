import React from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import type { EditablePost } from '@/lib/collections/posts/helpers';

export const GlossaryEditFormWrapper = ({document}: {
  document: EditablePost,
}) => {
  const { GlossaryEditFormNewPost, GlossaryEditForm } = Components;

  if (!document._id) return <GlossaryEditFormNewPost />
  return <GlossaryEditForm document={document} />
}

