import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import GlossaryEditFormNewPost from "@/components/jargon/GlossaryEditFormNewPost";
import GlossaryEditForm from "@/components/jargon/GlossaryEditForm";

export const GlossaryEditFormWrapper = ({document}: {
  document: PostsEditQueryFragment,
}) => {
  if (!document._id) return <GlossaryEditFormNewPost />
  return <GlossaryEditForm document={document} />
}

const GlossaryEditFormWrapperComponent = registerComponent('GlossaryEditFormWrapper', GlossaryEditFormWrapper);

declare global {
  interface ComponentTypes {
    GlossaryEditFormWrapper: typeof GlossaryEditFormWrapperComponent
  }
}

export default GlossaryEditFormWrapperComponent;
