import React, { useRef, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useSingle } from '../../lib/crud/withSingle';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import { Link } from '../../lib/reactRouterWrapper';
import Badge from '@material-ui/core/Badge';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { useTracking, AnalyticsContext } from '../../lib/analyticsEvents';
import { TagCommentType } from '../../lib/collections/comments/types';
import { tagGetHistoryUrl } from '../../lib/collections/tags/helpers';
import { ReactionChange } from '../../lib/collections/users/karmaChangesGraphQL';
import { karmaNotificationTimingChoices } from './KarmaChangeNotifierSettings';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { isEAForum } from '../../lib/instanceSettings';
import { eaAnonymousEmojiPalette, eaEmojiPalette } from '../../lib/voting/eaEmojiPalette';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    alignItems: 'center',
  },
  karmaNotifierButton: {
  },
  karmaNotifierPaper: {
  },
  karmaNotifierPopper: {
    zIndex: theme.zIndexes.karmaChangeNotifier,
  },
  starIcon: {
    color: isFriendlyUI ? theme.palette.grey[600] : theme.palette.header.text,
  },
  title: {
    display: 'block',
    paddingTop: theme.spacing.unit * 2,
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit
  },
  votedItems: {
  },
  votedItemRow: {
    height: 20
  },
  votedItemScoreChange: {
    display: "inline-block",
    minWidth: 20,
    textAlign: "right",
  },
  votedItemReacts: {
    marginLeft: isEAForum ? 12 : 6,
  },
  individualAddedReact: {
    color: isEAForum ? theme.palette.primary.main : undefined,
    marginLeft: 2,
    marginRight: isEAForum ? 6 : undefined,
  },
  votedItemDescription: {
    display: "inline-block",
    marginLeft: 5,
    whiteSpace: "nowrap",
    overflow: "hidden",
    maxWidth: 250,
    textOverflow: "ellipsis"
  },

  singleLinePreview: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    maxWidth: 300,
  },
  pointBadge: {
    fontSize: '0.9rem'
  },
  gainedPoints: {
    color: theme.palette.primary.main,
  },
  zeroPoints: {
  },
  lostPoints: {
  },
  settings: {
    display: 'block',
    textAlign: 'right',
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit * 2,
    paddingLeft: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.grey[500]
    }
  },
});

// Given a number, return a span of it as a string, with a plus sign if it's
// positive, and green, red, or black coloring for positive, negative, and
// zero, respectively.
const ColoredNumber = ({n, classes}: {
  n: number,
  classes: ClassesType
}) => {
  if (n>0) {
    return <span className={classes.gainedPoints}>{`+${n}`}</span>
  } else if (n===0) {
    return <span className={classes.zeroPoints}>{n}</span>
  } else {
    return <span className={classes.lostPoints}>{n}</span>
  }
}

const KarmaChangesDisplay = ({karmaChanges, classes, handleClose }: {
  karmaChanges: any,
  classes: ClassesType,
  handleClose: (ev: React.MouseEvent) => any,
}) => {
  const { posts, comments, tagRevisions, updateFrequency } = karmaChanges
  const { MenuItemLink, Typography } = Components;
  const currentUser = useCurrentUser();
  const noKarmaChanges = !(
    (posts && (posts.length > 0))
    || (comments && (comments.length > 0))
    || (tagRevisions && (tagRevisions.length > 0))
  )
  
  return (
    <Typography variant="body2">
      {noKarmaChanges ?
        <span className={classes.title}>{ karmaNotificationTimingChoices[updateFrequency].emptyText }</span>
        :
        <div>
          <span className={classes.title}>{ karmaNotificationTimingChoices[updateFrequency].infoText }</span>
          <div className={classes.votedItems}>
            {karmaChanges.posts && karmaChanges.posts.map((postChange: AnyBecauseTodo) => (
              <MenuItemLink
                className={classes.votedItemRow}
                to={postGetPageUrl(postChange)}
                key={postChange._id}
              >
                {(postChange.scoreChange !== 0) && <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={postChange.scoreChange} classes={classes}/>
                </span>}
                <span className={classes.votedItemReacts}>
                  <NewReactions reactionChanges={postChange.addedReacts} classes={classes}/>
                </span>
                <div className={classes.votedItemDescription}>
                  {postChange.title}
                </div>
              </MenuItemLink>
            ))}
            {karmaChanges.comments && karmaChanges.comments.map((commentChange: AnyBecauseTodo) => (
              <MenuItemLink
                className={classes.votedItemRow}
                // tagCommentType is given a String type in packages/lesswrong/lib/collections/users/karmaChangesGraphQL.ts because we couldn't get an inline union of literal types to work,
                // but actually we know it will always be a TagCommentType because the db schema constrains it
                to={commentGetPageUrlFromIds({postId:commentChange.postId, tagSlug:commentChange.tagSlug, tagCommentType:commentChange.tagCommentType as TagCommentType, commentId: commentChange._id})} key={commentChange._id}
              >
                {(commentChange.scoreChange !== 0) && <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={commentChange.scoreChange} classes={classes}/>
                </span>}
                {!!commentChange.addedReacts.length && <span className={classes.votedItemReacts}>
                  <NewReactions reactionChanges={commentChange.addedReacts} classes={classes}/>
                </span>}
                <div className={classes.votedItemDescription}>
                  {commentChange.description}
                </div>
              </MenuItemLink>
            ))}
            {karmaChanges.tagRevisions.map((tagChange: AnyBecauseTodo) => (
              <MenuItemLink
                className={classes.votedItemRow}
                key={tagChange._id}
                to={`${tagGetHistoryUrl({slug: tagChange.tagSlug})}?user=${currentUser!.slug}`}
              >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={tagChange.scoreChange} classes={classes}/>
                </span>
                <span className={classes.votedItemReacts}>
                  <NewReactions reactionChanges={tagChange.addedReacts} classes={classes}/>
                </span>
                <div className={classes.votedItemDescription}>
                  {tagChange.tagName}
                </div>
              </MenuItemLink>
            ))}
          </div>
        </div>
        }
      <Link to={`/account`} onClick={handleClose}>
        <span className={classes.settings}>{preferredHeadingCase("Change Settings")}</span>
      </Link>
    </Typography>
  );
}

const KarmaChangeNotifier = ({currentUser, className, classes}: {
  currentUser: UsersCurrent, //component can only be used if logged in
  className?: string,
  classes: ClassesType,
}) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const [cleared,setCleared] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorEl = useRef<HTMLDivElement|null>(null)
  const { captureEvent } = useTracking()
  const [karmaChangeLastOpened, setKarmaChangeLastOpened] = useState(currentUser?.karmaChangeLastOpened || new Date());
  
  const { document } = useSingle({
    documentId: currentUser._id,
    collectionName: "Users",
    fragmentName: "UserKarmaChanges",
  });
  
  const [stateKarmaChanges,setStateKarmaChanges] = useState(document?.karmaChanges);

  const handleOpen = () => {
    setOpen(true);
    setKarmaChangeLastOpened(new Date());
  }

  const handleClose = () => {
    setOpen(false);
    if (!currentUser) return;
    if (document?.karmaChanges) {
      void updateCurrentUser({
        karmaChangeLastOpened: document.karmaChanges.endDate,
        karmaChangeBatchStart: document.karmaChanges.startDate
      });

      if (document.karmaChanges.updateFrequency === "realtime") {
        setCleared(true);
      }
    }
  }

  const handleToggle = () => {
    if (open) {
      handleClose()
    } else {
      handleOpen()
    }
    captureEvent("karmaNotifierToggle", {open: !open, karmaChangeLastOpened, karmaChanges: stateKarmaChanges})
  }

  const render = () => {
    if (!document) return null
    const karmaChanges = stateKarmaChanges || document.karmaChanges; // Covers special case when state was initialized when user wasn't logged in
    if (!karmaChanges) return null;

    const { karmaChangeNotifierSettings: settings } = currentUser
    if (settings && settings.updateFrequency === "disabled")
      return null;

    const { posts, comments, tagRevisions, endDate, totalChange } = karmaChanges
    //Check if user opened the karmaChangeNotifications for the current interval
    const newKarmaChangesSinceLastVisit = new Date(karmaChangeLastOpened || 0) < new Date(endDate || 0)
    const starIsHollow = ((comments.length===0 && posts.length===0 && tagRevisions.length===0) || cleared || !newKarmaChangesSinceLastVisit)

    const { LWClickAwayListener, LWPopper, ForumIcon } = Components;

    return <AnalyticsContext pageSection="karmaChangeNotifer">
      <div className={classNames(classes.root, className)}>
        <div ref={anchorEl}>
          <IconButton onClick={handleToggle} className={classes.karmaNotifierButton}>
            {starIsHollow
              ? <ForumIcon icon="KarmaOutline" className={classes.starIcon}/>
              : <Badge badgeContent={
                  <span className={classes.pointBadge}>
                    {(totalChange !== 0) && <ColoredNumber n={totalChange} classes={classes}/>}
                  </span>}
                >
                  <ForumIcon icon="Karma" className={classes.starIcon}/>
                </Badge>
            }
          </IconButton>
        </div>
        <LWPopper
          open={open}
          anchorEl={anchorEl.current}
          placement="bottom-end"
          className={classes.karmaNotifierPopper}
        >
          <LWClickAwayListener onClickAway={handleClose}>
            <Paper className={classes.karmaNotifierPaper}>
              <KarmaChangesDisplay karmaChanges={karmaChanges} classes={classes} handleClose={handleClose} />
            </Paper>
          </LWClickAwayListener>
        </LWPopper>
      </div>
    </AnalyticsContext>
  }
  
  return render();
}

const NewReactions = ({reactionChanges, classes}: {
  reactionChanges: ReactionChange[],
  classes: ClassesType,
}) => {
  const { ReactionIcon, LWTooltip } = Components;

  const distinctReactionTypes = new Set<string>();
  for (let reactionChange of reactionChanges)
    distinctReactionTypes.add(reactionChange.reactionType);
  
  return <span>
    {[...distinctReactionTypes.keys()].map(reactionType => {
      let disableTooltip = false
      let EAEmojiComponent = eaEmojiPalette.find(emoji => emoji.name === reactionType)?.Component
      // On EAF, if the emoji is not in the list of non-anonymous reacts (eaEmojiPalette),
      // then make sure not to show any usernames of voters. They should not be available here anyway,
      // but we also don't want to show [anonymous], so we disable the tooltip altogether.
      if (!EAEmojiComponent && isEAForum) {
        EAEmojiComponent = eaAnonymousEmojiPalette.find(emoji => emoji.name === reactionType)?.Component
        disableTooltip = true
      }
    
      return <span
        className={classes.individualAddedReact}
        key={reactionType}
      >
        <LWTooltip
          title={
            reactionChanges.filter(r=>r.reactionType===reactionType)
              .map((r,i) => <>
                {i>0 && <>{", "}</>}
                <Components.UsersName documentId={r.userId}/>
              </>)
          }
          disabled={disableTooltip}
        >
          {(EAEmojiComponent && isEAForum) ? <EAEmojiComponent /> : <ReactionIcon
            react={reactionType}
          />}
        </LWTooltip>
      </span>
    })}
  </span>
}

const KarmaChangeNotifierComponent = registerComponent('KarmaChangeNotifier', KarmaChangeNotifier, {
  styles, stylePriority: -1, hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    KarmaChangeNotifier: typeof KarmaChangeNotifierComponent
  }
}
