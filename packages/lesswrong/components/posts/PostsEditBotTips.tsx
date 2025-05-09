import React, { RefObject } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isEAForum } from "../../lib/instanceSettings";
import classNames from "classnames";
import { useTracking } from "../../lib/analyticsEvents";
import { ForumIcon } from "../common/ForumIcon";

// For large screens, we show the card on the right-hand side of the editor.
const MIN_WIDTH_RHS_CARD = '1670px'
// For slightly smaller screens, we reduce the size of fonts/whitespace.
const MIN_WIDTH_RHS_CARD_SMALL = '1535px'
// For all smaller screens, we show the card under the editor instead of to the side.

const styles = (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    right: -345,
    top: -100,
    height: '120%',
    [`@media (max-width: ${MIN_WIDTH_RHS_CARD})`]: {
      right: -275,
    },
    [`@media (max-width: ${MIN_WIDTH_RHS_CARD_SMALL})`]: {
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
    [`@media (max-width: ${MIN_WIDTH_RHS_CARD})`]: {
      width: 242,
      padding: 12
    },
    [`@media (max-width: ${MIN_WIDTH_RHS_CARD_SMALL})`]: {
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
    [`@media (max-width: ${MIN_WIDTH_RHS_CARD})`]: {
      fontSize: 13,
      lineHeight: '20px',
    },
    [`@media (max-width: ${MIN_WIDTH_RHS_CARD_SMALL})`]: {
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
    [`@media (max-width: ${MIN_WIDTH_RHS_CARD})`]: {
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

const PostsEditBotTipsInner = ({handleDismiss, postId, className, nodeRef, classes}: {
  handleDismiss: () => void,
  postId?: string,
  className?: string,
  nodeRef: RefObject<HTMLElement|null>
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking()
  
  if (!isEAForum) {
    return null
  }

  return <aside className={classes.root} ref={nodeRef}>
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

export const PostsEditBotTips = registerComponent("PostsEditBotTips", PostsEditBotTipsInner, {styles, stylePriority: -1});


