import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useOnMountTracking } from "../../lib/analyticsEvents";
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
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
  classes: ClassesType,
  postId: string,
  limit?: number
}) => {
  const { results, loadMoreProps, loading } = useMulti({
    terms: {
      view: "pingbackPosts",
      filter: {
        postId,
      }
    },
    collectionName: "Posts",
    fragmentName: "PostsList",
    limit: limit,
    itemsPerPage: 100,
    enableTotal: true,
  });

  const pingbackIds = (results||[]).map((pingback) => pingback._id)
  useOnMountTracking({
    eventType: "pingbacksList",
    eventProps: {pingbackIds},
    captureOnMount: (eventProps: { pingbackIds: string[] }) => eventProps.pingbackIds.length > 0,
    skip: !pingbackIds.length||loading
  })

  const { Pingback, LWTooltip, LoadMore, Loading } = Components

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

const PingbacksListComponent = registerComponent("PingbacksList", PingbacksList, {styles});

declare global {
  interface ComponentTypes {
    PingbacksList: typeof PingbacksListComponent
  }
}
