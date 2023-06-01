import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import { Link } from "../../lib/reactRouterWrapper";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    right: -335,
    top: -100,
    height: '130%',
    '@media (max-width: 1360px)': {
      right: -268,
    },
    '@media (max-width: 1234px)': {
      position: 'static',
      marginTop: 16
    },
  },
  card: {
    position: 'sticky',
    top: 90,
    width: 311,
    background: theme.palette.background.primaryTranslucent,
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    padding: 16,
    borderRadius: theme.borderRadius.default,
    '@media (max-width: 1360px)': {
      width: 242,
      padding: 12
    },
    '@media (max-width: 1234px)': {
      position: 'static',
      width: '100%'
    },
  },
  headingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: 8
  },
  heading: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: '21px',
    margin: 0,
    '@media (max-width: 1360px)': {
      fontSize: 13,
      lineHeight: '20px',
    },
    '@media (max-width: 1234px)': {
      fontSize: 14,
    },
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
    lineHeight: '21px',
    marginTop: 12,
    '@media (max-width: 1360px)': {
      fontSize: 13,
      lineHeight: '20px',
    },
  },
  link: {
    textDecoration: 'underline',
    '&:hover': {
      color: theme.palette.primary.dark,
      opacity: 1,
      textDecoration: 'underline',
    }
  },
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

  return <aside className={classNames(className, classes.root)}>
    <div className={classes.card}>
      <div className={classes.headingRow}>
        <h2 className={classes.heading}>A tip for constructive criticism</h2>
        <button className={classes.close} onClick={handleDismiss}>
          <ForumIcon icon="Close" className={classes.closeIcon}/>
        </button>
      </div>
      <div className={classes.textRow}>
        Our bot flagged this as potential criticism of someone's work. We suggest running criticism
        past the relevant people first. <Link to={`https://forum.effectivealtruism.org/posts/f77iuXmgiiFgurnBu/run-posts-by-orgs`} className={classes.link}>
          Here's why and how
        </Link>.
      </div>
    </div>
  </aside>
}

const PostsEditBotTipsComponent = registerComponent("PostsEditBotTips", PostsEditBotTips, {styles});

declare global {
  interface ComponentTypes {
    PostsEditBotTips: typeof PostsEditBotTipsComponent
  }
}
