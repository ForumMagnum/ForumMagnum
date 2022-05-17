import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
});

const TagLinkpostSupplementalComments = ({post, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType
}) => {
  return <div>PLACEHOLDER</div>
}

const TagLinkpostSupplementalCommentsComponent = registerComponent("TagLinkpostSupplementalComments", TagLinkpostSupplementalComments, {styles});

declare global {
  interface ComponentTypes {
    TagLinkpostSupplementalComments: typeof TagLinkpostSupplementalCommentsComponent
  }
}
