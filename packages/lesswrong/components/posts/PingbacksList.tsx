import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useOnMountTracking } from "../../lib/analyticsEvents";
import { isFriendlyUI } from '../../themes/forumTheme';
import Pingback from "./Pingback";
import LWTooltip from "../common/LWTooltip";
import LoadMore from "../common/LoadMore";
import Loading from "../vulcan-core/Loading";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

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

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    marginTop: theme.spacing.unit*2
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
    ...(isFriendlyUI
      ? {
        fontWeight: 600,
        marginTop: 12,
        color: theme.palette.primary.main,
        "&:hover": {
          color: theme.palette.primary.dark,
          opacity: 1,
        },
      }
      : {
        color: theme.palette.lwTertiary.main,
      }),
  },
  list: {
    marginTop: theme.spacing.unit
  },
});

const PingbacksList = ({classes, postId, limit=5}: {
  classes: ClassesType<typeof styles>,
  postId: string,
  limit?: number
}) => {
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

export default registerComponent("PingbacksList", PingbacksList, {styles});


