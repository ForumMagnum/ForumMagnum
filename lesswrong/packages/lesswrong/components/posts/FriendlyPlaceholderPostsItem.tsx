import classNames from 'classnames';
import React from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import type { PostsListViewType } from '../hooks/usePostsListView';
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const styles = (theme: ThemeType) => ({
  root: {
    minWidth: "100%",
    width: SECTION_WIDTH,
    maxWidth: "100%",
    background: theme.palette.grey[0],
    padding: '15px 17px',
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down("xs")]: {
      padding: '14px 17px 12px',
    },
  },
  rootCard: {
    padding: '16px 17px',
    marginBottom: 2,
    height: 143,
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 18,
  },
  placeholder: {
    height: 10,
    background: theme.palette.panelBackground.placeholderGradient,
    backgroundSize: "300% 100%",
    animation: "profile-image-loader 1.8s infinite",
    borderRadius: 3,
  },
  karma: {
    flex: 'none',
    width: 16,
  },
  titleCol: {
    flexGrow: 1,
  },
  title: {
    width: '100%',
    maxWidth: 434,
    marginBottom: 10,
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 18,
  },
  authorWrapper: {
    flexGrow: 1,
  },
  author: {
    width: '100%',
    maxWidth: 183,
  },
  commentIcon: {
    flex: 'none',
    width: 33,
    marginRight: 4,
  },
  commentIconMobile: {
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  commentIconCard: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
  threeDotsIcon: {
    flex: 'none',
    height: 15,
    width: 10,
  },
  threeDotsIconMobile: {
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  threeDotsIconCard: {
    alignSelf: "flex-start",
  },
  hideOnMobile: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
})

const FriendlyPlaceholderPostsItem = ({viewType = "list", classes}: {
  viewType?: PostsListViewType,
  classes: ClassesType<typeof styles>,
}) => {
  const cardView = viewType === "card";
  return (
    <div className={classNames(classes.root, cardView && classes.rootCard)}>
      <div className={classes.container}>
        <div className={classNames(classes.placeholder, classes.karma)}></div>
        <div className={classes.titleCol}>
          <div className={classNames(classes.placeholder, classes.title)}></div>
          <div className={classes.metaRow}>
            <div className={classes.authorWrapper}>
              <div className={classNames(classes.placeholder, classes.author)}></div>
            </div>
            <div className={classNames(
              classes.placeholder,
              classes.commentIcon,
              classes.commentIconMobile,
            )} />
            <div className={classNames(
              classes.placeholder,
              classes.threeDotsIcon,
              classes.threeDotsIconMobile,
            )} />
          </div>
        </div>
        <div className={classNames(
          classes.placeholder,
          classes.commentIcon,
          classes.hideOnMobile,
          cardView && classes.commentIconCard,
        )} />
        <div className={classNames(
          classes.placeholder,
          classes.threeDotsIcon,
          classes.hideOnMobile,
          cardView && classes.threeDotsIconCard,
        )} />
      </div>
    </div>
  );
}

const FriendlyPlaceholderPostsItemComponent = registerComponent('FriendlyPlaceholderPostsItem', FriendlyPlaceholderPostsItem, {styles});

declare global {
  interface ComponentTypes {
    FriendlyPlaceholderPostsItem: typeof FriendlyPlaceholderPostsItemComponent
  }
}

export default FriendlyPlaceholderPostsItemComponent;
