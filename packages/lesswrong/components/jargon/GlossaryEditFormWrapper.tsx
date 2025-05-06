import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { EditablePost } from '@/lib/collections/posts/helpers';

export const GlossaryEditFormWrapper = ({document}: {
  document: EditablePost,
}) => {
  const { GlossaryEditFormNewPost, GlossaryEditForm } = Components;

  if (!document._id) return <GlossaryEditFormNewPost />
  return <GlossaryEditForm document={document} />
}

const GlossaryEditFormWrapperComponent = registerComponent('GlossaryEditFormWrapper', GlossaryEditFormWrapper);

declare global {
  interface ComponentTypes {
    GlossaryEditFormWrapper: typeof GlossaryEditFormWrapperComponent
  }
}
