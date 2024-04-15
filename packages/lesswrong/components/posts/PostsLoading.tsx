import range from 'lodash/range';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { isFriendlyUI } from '../../themes/forumTheme';

const PostsLoading = ({placeholderCount}: {
  placeholderCount?: number
}) => {
  if (placeholderCount && isFriendlyUI) {
    return <>
      {range(0, placeholderCount)
        .map(i => <Components.FriendlyPlaceholderPostsItem
          key={i}
        />)}
    </>
  } else {
    return <Components.Loading />
  }
};

const PostsLoadingComponent = registerComponent('PostsLoading', PostsLoading);

declare global {
  interface ComponentTypes {
    PostsLoading: typeof PostsLoadingComponent
  }
}

