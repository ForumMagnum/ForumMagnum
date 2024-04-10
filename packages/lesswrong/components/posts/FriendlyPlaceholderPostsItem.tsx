import classNames from 'classnames';
import React from 'react';
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 18,
    minWidth: "100%",
    maxWidth: "100%",
    background: theme.palette.grey[0],
    padding: 15,
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down("xs")]: {
      paddingBottom: 14,
    },
  },
  placeholder: {
    height: 10,
    background: theme.palette.panelBackground.placeholderGradient,
    backgroundSize: "300% 100%",
    animation: "profile-image-loader 1s infinite",
    borderRadius: 3,
  },
  karmaCol: {
    flex: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    paddingLeft: 2,
  },
  arrow: {
    width: 10
  },
  karma: {
    width: 16,
  },
  titleCol: {
    flexGrow: 1,
  },
  title: {
    height: 12,
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
    height: 8,
    width: '100%',
    maxWidth: 183,
  },
  commentIcon: {
    flex: 'none',
    height: 12,
    width: 33,
    marginRight: 4,
  },
  commentIconMobile: {
    height: 8,
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  threeDotsIcon: {
    flex: 'none',
    height: 15,
    width: 10,
    marginRight: 2,
  },
  threeDotsIconMobile: {
    height: 10,
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  hideOnMobile: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
})

const FriendlyPlaceholderPostsItem = ({classes}: {
  classes: ClassesType,
}) => {
  return <div className={classes.root}>
    <div className={classes.karmaCol}>
      <div className={classNames(classes.placeholder, classes.arrow)}></div>
      <div className={classNames(classes.placeholder, classes.karma)}></div>
    </div>
    <div className={classes.titleCol}>
      <div className={classNames(classes.placeholder, classes.title)}></div>
      <div className={classes.metaRow}>
        <div className={classes.authorWrapper}>
          <div className={classNames(classes.placeholder, classes.author)}></div>
        </div>
        <div className={classNames(classes.placeholder, classes.commentIcon, classes.commentIconMobile)}></div>
        <div className={classNames(classes.placeholder, classes.threeDotsIcon, classes.threeDotsIconMobile)}></div>
      </div>
    </div>
    <div className={classNames(classes.placeholder, classes.commentIcon, classes.hideOnMobile)}></div>
    <div className={classNames(classes.placeholder, classes.threeDotsIcon, classes.hideOnMobile)}></div>
  </div>
}

const FriendlyPlaceholderPostsItemComponent = registerComponent('FriendlyPlaceholderPostsItem', FriendlyPlaceholderPostsItem, {styles});

declare global {
  interface ComponentTypes {
    FriendlyPlaceholderPostsItem: typeof FriendlyPlaceholderPostsItemComponent
  }
}
