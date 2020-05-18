import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = theme => ({

});

const AddPostsToTag = ({classes}: {
  classes: ClassesType,
  tag: TagPreviewFragment
}) => {
  const {  } = Components
  return <div>

  </div>
}

const AddPostsToTagComponent = registerComponent("AddPostsToTag", AddPostsToTag, {styles});

declare global {
  interface ComponentTypes {
    AddPostsToTag: typeof AddPostsToTagComponent
  }
}

