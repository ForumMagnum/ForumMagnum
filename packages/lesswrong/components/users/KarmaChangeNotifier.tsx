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
import { preferredHeadingCase } from '../../lib/forumTypeUtils';

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
    color: theme.palette.header.text,
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

export const karmaNotificationTimingChoices = {
  disabled: {
    label: "Disabled",
    infoText: "Karma changes are disabled",
    emptyText: "Karma changes are disabled"
  },
  daily: {
    label: "Batched daily (default)",
    infoText: "Karma Changes (batched daily):",
    emptyText: "No karma changes yesterday"
  },
  weekly: {
    label: "Batched weekly",
    infoText: "Karma Changes (batched weekly):",
    emptyText: "No karma changes last week"
  },
  realtime: {
    label: "Realtime",
    infoText: "Recent Karma Changes",
    emptyText: "No karma changes since you last checked"
  },
};

// Given a number, return a span of it as a string, with a plus sign if it's
// positive, and green, red, or black coloring for positive, negative, and
// zero, respectively.
const ColoredNumber = ({n, classes}: {
  n: number,
  classes: ClassesType
}) => {
  if (n>0) {
    return <span className={classes.gainedPoints}>{`+${n}`}</span>
  } else if (n==0) {
    return <span className={classes.zeroPoints}>{n}</span>
  } else {
    return <span className={classes.lostPoints}>{n}</span>
  }
}

const KarmaChangesDisplay = ({karmaChanges, classes, handleClose }: {
  karmaChanges: any,
  classes: ClassesType,
  handleClose: (ev: React.MouseEvent)=>any,
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
            {karmaChanges.posts && karmaChanges.posts.map(postChange => (
              <MenuItemLink
                className={classes.votedItemRow}
                to={postGetPageUrl(postChange)}
                key={postChange._id}
              >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={postChange.scoreChange} classes={classes}/>
                </span>
                <div className={classes.votedItemDescription}>
                  {postChange.title}
                </div>
              </MenuItemLink>
            ))}
            {karmaChanges.comments && karmaChanges.comments.map(commentChange => (
              <MenuItemLink
                className={classes.votedItemRow}
                // tagCommentType is given a String type in packages/lesswrong/lib/collections/users/karmaChangesGraphQL.ts because we couldn't get an inline union of literal types to work,
                // but actually we know it will always be a TagCommentType because the db schema constrains it
                to={commentGetPageUrlFromIds({postId:commentChange.postId, tagSlug:commentChange.tagSlug, tagCommentType:commentChange.tagCommentType as TagCommentType, commentId: commentChange._id})} key={commentChange._id}
              >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={commentChange.scoreChange} classes={classes}/>
                </span>
                <div className={classes.votedItemDescription}>
                  {commentChange.description}
                </div>
              </MenuItemLink>
            ))}
            {karmaChanges.tagRevisions.map(tagChange => (
              <MenuItemLink
                className={classes.votedItemRow}
                key={tagChange._id}
                to={`${tagGetHistoryUrl({slug: tagChange.tagSlug})}?user=${currentUser!.slug}`}
              >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={tagChange.scoreChange} classes={classes}/>
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

const KarmaChangeNotifier = ({currentUser, classes}: {
  currentUser: UsersCurrent, //component can only be used if logged in
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
      <div className={classes.root}>
        <div ref={anchorEl}>
          <IconButton onClick={handleToggle} className={classes.karmaNotifierButton}>
            {starIsHollow
              ? <ForumIcon icon="StarBorder" className={classes.starIcon}/>
              : <Badge badgeContent={<span className={classes.pointBadge}><ColoredNumber n={totalChange} classes={classes}/></span>}>
                  <ForumIcon icon="Star" className={classes.starIcon}/>
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

const KarmaChangeNotifierComponent = registerComponent('KarmaChangeNotifier', KarmaChangeNotifier, {
  styles, hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    KarmaChangeNotifier: typeof KarmaChangeNotifierComponent
  }
}
