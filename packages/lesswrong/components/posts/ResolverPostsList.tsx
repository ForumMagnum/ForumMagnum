import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useOnMountTracking, useTracking } from "../../lib/analyticsEvents";
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Loading } from "../vulcan-core/Loading";
import { PostsItem } from "./PostsItem";
import { LoadMore } from "../common/LoadMore";
import { SectionFooter } from "../common/SectionFooter";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ResolverPostsListInner = ({resolverName, skip, limit=13, showLoadMore=false, fallbackText, classes}: {
  resolverName: string,
  skip?: boolean,
  limit?: number,
  showLoadMore?: boolean,
  fallbackText?: string
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loading, loadMoreProps } = usePaginatedResolver({
    resolverName, 
    fragmentName: "PostsListWithVotes",
    limit,
    skip
  });

  const postIds = results?.map((post) => post._id) ?? []

  useOnMountTracking({
    eventType: "postList",
    eventProps: { postIds, resolverName },
    captureOnMount: (eventProps) => eventProps.postIds.length > 0,
    skip: !postIds.length || loading,
  });

  if (loading && !results) {
    return <Loading/>
  }

  if (!results) {
    return <div>{fallbackText}</div>;
  }

  return <div>
    {results.map((post) => <PostsItem key={post._id} post={post} />)}
    {showLoadMore && <SectionFooter>
      <LoadMore
        {...loadMoreProps}
        sectionFooterStyles
      />
    </SectionFooter>}
  </div>

}

export const ResolverPostsList = registerComponent('ResolverPostsList', ResolverPostsListInner, {styles});

declare global {
  interface ComponentTypes {
    ResolverPostsList: typeof ResolverPostsList
  }
}

