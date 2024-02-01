import classNames from 'classnames';
import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';

export const styles = (theme: ThemeType) => ({
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  root: {
    position: "relative",
    minWidth: 0,
    [theme.breakpoints.down('xs')]: {
      width: "100%"
    },
    '&:hover .PostsItemTrailingButtons-actions': {
      opacity: .2,
    },
    '&:hover .PostsItemTrailingButtons-archiveButton': {
      opacity: .2,
    }
  },
  background: {
    width: "100%",
    background: theme.palette.panelBackground.default,
  },
  bottomBorder: {
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  title: {
    paddingLeft: 10,
    minHeight: 26,
    color: theme.palette.text.normal,
    position: "relative",
    lineHeight: "1.7rem",
    fontFamily: theme.typography.postStyle.fontFamily,
    zIndex: theme.zIndexes.postItemTitle,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    alignItems: "center",
    marginRight: theme.spacing.unit,
    flex: 1500,
    maxWidth: "fit-content",
    ...theme.typography.postsItemTitle,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 2,
      whiteSpace: "unset",
      lineHeight: "1.8rem",
      order:-1,
      height: "unset",
      maxWidth: "unset",
      width: "100%",
      paddingRight: theme.spacing.unit,
      flex: "unset",
    },
    [theme.breakpoints.up('sm')]: {
      position: "relative",
      top: 3,
    },
    '&:hover': {
      opacity: 1,
    }
  },
  postsItemInner: {
    display: "flex",
    position: "relative",
    padding: 10,
    paddingTop: 7,
    paddingBottom: 8,
    alignItems: "center",
    flexWrap: "nowrap",
    [theme.breakpoints.down('xs')]: {
      flexWrap: "wrap",
      paddingTop: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
      paddingLeft: 5
    },
  },
  spacer: {
    flex: 1,
    [theme.breakpoints.down('xs')]: {
      display: "none"
    },
  },
  author: {
    justifyContent: "flex",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis", // I'm not sure this line worked properly?
    marginRight: theme.spacing.unit*1.5,
    zIndex: theme.zIndexes.postItemAuthor,
    flex: 1000,
    maxWidth: "fit-content",
    [theme.breakpoints.down('xs')]: {
      justifyContent: "flex-end",
      width: "unset",
      marginLeft: 0,
      flex: "unset"
    }
  },
  isRead: {
    // this is just a placeholder, enabling easier theming.
  },
});

type TopPostItemProps = {
  post: PostsTopItemInfo,
  classes: ClassesType<typeof styles>,
};

const TopPostItem = ({ post, classes }: TopPostItemProps) => {
  const { PostsUserAndCoauthors, PostsItem2MetaInfo, AnalyticsTracker, HoverOver, TopPostItemTooltip } = Components;

  const tooltip = <TopPostItemTooltip post={post} />;

  const title = (
    <span className={classes.title}>
      <AnalyticsTracker
        eventType={"postItem"}
        captureOnMount={(eventData) => eventData.capturePostItemOnMount}
        captureOnClick={false}
      >
        <Link to={postGetPageUrl(post)}>{post.title}</Link>
      </AnalyticsTracker>
    </span>
  );

  const authors = (
    <PostsItem2MetaInfo className={classes.author}>
      <PostsUserAndCoauthors post={post} tooltipPlacement="top" abbreviateIfLong simple={false} />
    </PostsItem2MetaInfo>
  );

  return (
    <div className={classes.row}>
      {/* TODO: maybe put the isRead styling back? */}
      <div className={classNames(classes.root, classes.background, classes.bottomBorder)}>
        <HoverOver
          className={classes.postsItemInner}
          title={tooltip}
          placement='bottom-end'
          tooltip={false}
          inlineBlock={false}
          As='div'
          hideOnTouchScreens
        >
          {title}
          {/* space in-between title and author if there is width remaining */}
          <span className={classes.spacer} />
          {authors}
        </HoverOver>
      </div>
    </div>
  )
};

const TopPostItemComponent = registerComponent('TopPostItem', TopPostItem, {
  styles,
  stylePriority: 1,
  hocs: [withErrorBoundary],
  areEqual: {
    terms: "deep",
  },
});

declare global {
  interface ComponentTypes {
    TopPostItem: typeof TopPostItemComponent
  }
}
