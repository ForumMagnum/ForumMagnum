import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import { Link } from "../../lib/reactRouterWrapper";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    // position: 'absolute',
    // right: -420,
    maxWidth: 411,
    background: theme.palette.background.primaryTranslucent,
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    padding: 16,
    borderRadius: theme.borderRadius.default,
    '@media (max-width: 1140px)': {
      display: 'none'
    },
  },
  headingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: 10
  },
  heading: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: '19px',
    margin: 0
  },
  close: {
    alignSelf: 'flex-start',
    background: 'none',
    color: theme.palette.primary.main,
    padding: 0,
    '&:hover': {
      color: theme.palette.primary.dark,
    }
  },
  closeIcon: {
    fontSize: 16,
  },
  textRow: {
    fontWeight: '500',
    fontSize: 14,
    lineHeight: '19px',
    marginTop: 12
  },
  link: {
    textDecoration: 'underline',
    '&:hover': {
      color: theme.palette.primary.dark,
      opacity: 1,
      textDecoration: 'underline',
    }
  },
  rootMobile: {
    display: 'none',
    '@media (max-width: 1140px)': {
      display: 'block',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      background: theme.palette.primary.main,
      color: theme.palette.text.alwaysWhite,
      fontFamily: theme.typography.fontFamily,
      padding: 24,
      zIndex: theme.zIndexes.notificationsMenu,
    },
  },
  closeMobile: {
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      color: theme.palette.grey[200]
    }
  }
});

const PostsEditBotTips = ({handleDismiss, className, classes}: {
  handleDismiss: ()=>void,
  className?: string,
  classes: ClassesType,
}) => {
  if (!isEAForum) {
    return null
  }
  
  const { ForumIcon } = Components

  return <>
    <aside className={classNames(className, classes.rootMobile)}>
      <div className={classes.headingRow}>
        <h2 className={classes.heading}>Tips for making criticism go better</h2>
        <button className={classNames(classes.close, classes.closeMobile)} onClick={handleDismiss}>
          <ForumIcon icon="Close" className={classes.closeIcon}/>
        </button>
      </div>
      <div className={classes.textRow}>
        Our bot thinks you're writing criticism. <Link to={`https://forum.effectivealtruism.org/posts/f77iuXmgiiFgurnBu/run-posts-by-orgs`} className={classes.link}>
          Here are our tips
        </Link>. You can also check <Link to={`https://forum.effectivealtruism.org/posts/f77iuXmgiiFgurnBu/run-posts-by-orgs`} className={classes.link}>
          our list
        </Link> of key people and organizations to see how they like to engage in criticism.
      </div>
    </aside>
    <aside className={classNames(className, classes.root)}>
      <div className={classes.headingRow}>
        <h2 className={classes.heading}>Tips for making criticism go better</h2>
        <button className={classes.close} onClick={handleDismiss}>
          <ForumIcon icon="Close" className={classes.closeIcon}/>
        </button>
      </div>
      <div className={classes.textRow}>
        Our bot thinks you're writing criticism. <Link to={`https://forum.effectivealtruism.org/posts/f77iuXmgiiFgurnBu/run-posts-by-orgs`} className={classes.link}>Here are our tips</Link>.
      </div>
      <div className={classes.textRow}>
        You can also check <Link to={`https://forum.effectivealtruism.org/posts/f77iuXmgiiFgurnBu/run-posts-by-orgs`} className={classes.link}>our list of key people and organizations</Link> to see how they like to engage in criticism.
      </div>
    </aside>
  </>
}

const PostsEditBotTipsComponent = registerComponent("PostsEditBotTips", PostsEditBotTips, {styles});

declare global {
  interface ComponentTypes {
    PostsEditBotTips: typeof PostsEditBotTipsComponent
  }
}
