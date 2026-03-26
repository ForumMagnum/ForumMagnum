import React from 'react';
import { useOnMountTracking } from "../../lib/analyticsEvents";
import Pingback from "./Pingback";
import LWTooltip from "../common/LWTooltip";
import LoadMore from "../common/LoadMore";
import Loading from "../vulcan-core/Loading";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const PostsListMultiQuery = gql(`
  query multiPostPingbacksListQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsList
      }
      totalCount
    }
  }
`);

const styles = defineStyles("PingbacksList", (theme: ThemeType) => ({
  root: {
    marginBottom: 32,
    marginTop: 16
  },
  title: {
    ...theme.typography.commentStyle,
    display: "inline-block",
    lineHeight: "1rem",
    marginBottom: -4
  },
  loadMore: {
    ...theme.typography.commentStyle,
    display: "inline-block",
    lineHeight: "1rem",
    marginBottom: -4,
    color: theme.palette.lwTertiary.main,
  },
  list: {
    marginTop: 8
  },
}));

const PingbacksList = ({postId, limit=5}: {
  postId: string,
  limit?: number
}) => {
  const classes = useStyles(styles);
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(PostsListMultiQuery, {
    variables: {
      selector: { pingbackPosts: { postId: postId } },
      limit,
      enableTotal: true,
    },
  });

  const results = data?.posts?.results;

  const pingbackIds = (results||[]).map((pingback) => pingback._id)
  useOnMountTracking({
    eventType: "pingbacksList",
    eventProps: {pingbackIds},
    captureOnMount: (eventProps: { pingbackIds: string[] }) => eventProps.pingbackIds.length > 0,
    skip: !pingbackIds.length||loading
  })
  if (results) {
    if (results.length > 0) {
      return <div className={classes.root}>
        <div className={classes.title}>
          <LWTooltip title="Posts that linked to this post" placement="right">
            <span>Mentioned in</span>
          </LWTooltip>
        </div>
        <div className={classes.list}>
          {results.map((post) =>
            <div key={post._id} >
              <Pingback post={post}/>
            </div>
          )}
        </div>
        {loading ? <Loading /> : <LoadMore className={classes.loadMore} {...loadMoreProps}/>}
      </div>
    }
  }

  return null;
}

export default PingbacksList


