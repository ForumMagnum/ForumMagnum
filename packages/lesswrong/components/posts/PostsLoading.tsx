import range from 'lodash/range';
import React from 'react';
import { LoadMorePlaceholder } from '../common/LoadMore';
import SectionFooter from '../common/SectionFooter';
import type { PostsListViewType } from '../hooks/usePostsListView';
import Loading from "../vulcan-core/Loading";
import LWPlaceholderPostsItem from "./LWPlaceholderPostsItem";

const PostsLoading = ({
  placeholderCount,
  loadMore,
  showFinalBottomBorder,
  viewType = "list",
  children
}: {
  placeholderCount?: number,
  loadMore?: boolean,
  showFinalBottomBorder?: boolean
  viewType?: PostsListViewType,
  children?: React.ReactNode,
}) => {
  if (!placeholderCount) {
    return <Loading />;
  }

  return <>
          {range(0, placeholderCount)
            .map(i => <LWPlaceholderPostsItem
              key={i}
              showBottomBorder={showFinalBottomBorder || i+1<placeholderCount}
            />)}
          {!!(loadMore || children) && <SectionFooter>
            {loadMore && <LoadMorePlaceholder sectionFooterStyles/>}
            {children}
          </SectionFooter>}
        </>
};

export default PostsLoading;


