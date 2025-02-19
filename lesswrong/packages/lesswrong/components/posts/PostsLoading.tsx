import range from 'lodash/range';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { isFriendlyUI } from '../../themes/forumTheme';
import type { PostsListViewType } from '../hooks/usePostsListView';

const PostsLoading = ({
  placeholderCount,
  showFinalBottomBorder,
  viewType = "list",
}: {
  placeholderCount?: number,
  showFinalBottomBorder?: boolean
  viewType?: PostsListViewType,
}) => {
  if (!placeholderCount) {
    return <Components.Loading />;
  }

  if (isFriendlyUI) {
    return <>
      {range(0, placeholderCount)
        .map(i => <Components.FriendlyPlaceholderPostsItem
          key={i}
          viewType={viewType}
        />)}
    </>
  } else {
    return <>
      {range(0, placeholderCount)
        .map(i => <Components.LWPlaceholderPostsItem
          key={i}
          showBottomBorder={showFinalBottomBorder || i+1<placeholderCount}
        />)}
    </>
  }
};

const PostsLoadingComponent = registerComponent('PostsLoading', PostsLoading);

declare global {
  interface ComponentTypes {
    PostsLoading: typeof PostsLoadingComponent
  }
}
