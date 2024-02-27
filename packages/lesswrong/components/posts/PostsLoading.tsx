import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import range from 'lodash/range';

const PostsLoading = ({placeholderCount}: {
  placeholderCount?: number
}) => {
  if (placeholderCount) {
    return <>
      {range(0, placeholderCount)
        .map(i => <Components.LWPlaceholderPostsItem
          key={i}
          showBottomBorder={i+1<placeholderCount}
        />)}
    </>
  } else {
    return <Components.Loading/>
  }
};

const PostsLoadingComponent = registerComponent('PostsLoading', PostsLoading);

declare global {
  interface ComponentTypes {
    PostsLoading: typeof PostsLoadingComponent
  }
}

