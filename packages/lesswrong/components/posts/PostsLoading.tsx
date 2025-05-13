import range from 'lodash/range';
import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { isFriendlyUI } from '../../themes/forumTheme';
import type { PostsListViewType } from '../hooks/usePostsListView';
import Loading from "../vulcan-core/Loading";
import FriendlyPlaceholderPostsItem from "./FriendlyPlaceholderPostsItem";
import LWPlaceholderPostsItem from "./LWPlaceholderPostsItem";

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

export default registerComponent('PostsLoading', PostsLoading);


