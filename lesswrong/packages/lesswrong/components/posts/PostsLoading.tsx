import range from 'lodash/range';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { isFriendlyUI } from '../../themes/forumTheme';
import type { PostsListViewType } from '../hooks/usePostsListView';
import LWPlaceholderPostsItem from "@/components/posts/LWPlaceholderPostsItem";
import FriendlyPlaceholderPostsItem from "@/components/posts/FriendlyPlaceholderPostsItem";
import { Loading } from "@/components/vulcan-core/Loading";

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
    return <Loading />;
  }

  if (isFriendlyUI) {
    return <>
      {range(0, placeholderCount)
        .map(i => <FriendlyPlaceholderPostsItem
          key={i}
          viewType={viewType}
        />)}
    </>
  } else {
    return <>
      {range(0, placeholderCount)
        .map(i => <LWPlaceholderPostsItem
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

export default PostsLoadingComponent;
