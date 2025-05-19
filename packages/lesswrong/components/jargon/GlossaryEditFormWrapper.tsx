import React from 'react';
import type { EditablePost } from '@/lib/collections/posts/helpers';
import GlossaryEditFormNewPost from "./GlossaryEditFormNewPost";
import GlossaryEditForm from "./GlossaryEditForm";

export const GlossaryEditFormWrapper = ({document}: {
  document: EditablePost,
}) => {
  if (!document._id) return <GlossaryEditFormNewPost />
  return <GlossaryEditForm document={document} />
}

