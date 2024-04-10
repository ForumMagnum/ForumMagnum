import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import classNames from "classnames";
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    right: -390,
    top: -100,
    height: '120%',
    '@media (max-width: 1500px)': {
      right: -335,
    },
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
    color: theme.palette.text.primaryAlert,
    fontFamily: theme.typography.fontFamily,
    padding: 16,
    borderRadius: theme.borderRadius.default,
    transition: 'opacity 0.4s ease',
    opacity: 0,
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
    color: theme.palette.text.primaryAlert,
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

const PostsEditBotTips = ({handleDismiss, postId, className, classes}: {
  handleDismiss: () => void,
  postId?: string,
  className?: string,
  classes: ClassesType,
}) => {
  const {captureEvent} = useTracking()
  
  if (!isEAForum) {
    return null
  }
  
  const { ForumIcon } = Components

  return <aside className={classes.root}>
    <div className={classNames(className, classes.card)}>
      <div className={classes.headingRow}>
        <h2 className={classes.heading}>A tip for constructive criticism</h2>
        <button type="button" className={classes.close} onClick={handleDismiss}>
          <ForumIcon icon="Close" className={classes.closeIcon}/>
        </button>
      </div>
      <div className={classes.textRow}>
        Our bot tagged this as potential criticism of someone's work.
        Have you considered running it past them first? If not, <a
          href="https://forum.effectivealtruism.org/posts/kjcMZEzksusCHfHiF/productive-criticism-running-a-draft-past-the-people-you-re"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => captureEvent('criticismTipsLinkClicked', {postId})}
          className={classes.link}
        >
          here's why you might do it and how
        </a>.
      </div>
    </div>
  </aside>
}

const PostsEditBotTipsComponent = registerComponent("PostsEditBotTips", PostsEditBotTips, {styles, stylePriority: -1});

declare global {
  interface ComponentTypes {
    PostsEditBotTips: typeof PostsEditBotTipsComponent
  }
}
