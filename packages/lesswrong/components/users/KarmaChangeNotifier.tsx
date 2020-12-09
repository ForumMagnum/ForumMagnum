import React, { PureComponent } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { withUpdateCurrentUser, WithUpdateCurrentUserProps } from '../hooks/useUpdateCurrentUser';
import { withSingle } from '../../lib/crud/withSingle';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import Popper from '@material-ui/core/Popper';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import { Link } from '../../lib/reactRouterWrapper';
import Users from '../../lib/collections/users/collection';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Badge from '@material-ui/core/Badge';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import { getHeaderTextColor } from '../common/Header';
import MenuItem from '@material-ui/core/MenuItem';
import { karmaNotificationTimingChoices } from './KarmaChangeNotifierSettings'
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { withTracking, AnalyticsContext } from '../../lib/analyticsEvents';


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
    color: getHeaderTextColor(theme),
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
  handleClose: (ev: MouseEvent)=>any,
}) => {
  const { posts, comments, updateFrequency } = karmaChanges
  const noKarmaChanges = !((posts && (posts.length > 0)) || (comments && (comments.length > 0)))
  
  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Case to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;
  
  return (
    <Components.Typography variant="body2">
      {noKarmaChanges ?
        <span className={classes.title}>{ karmaNotificationTimingChoices[updateFrequency].emptyText }</span>
        :
        <div>
          <span className={classes.title}>{ karmaNotificationTimingChoices[updateFrequency].infoText }</span>
          <div className={classes.votedItems}>
            {karmaChanges.posts && karmaChanges.posts.map(postChange => (
              <MenuItemUntyped
                className={classes.votedItemRow}
                component={Link} to={postGetPageUrl(postChange)} key={postChange._id} >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={postChange.scoreChange} classes={classes}/>
                </span>
                <div className={classes.votedItemDescription}>
                  {postChange.title}
                </div>
                </MenuItemUntyped>
            ))}
            {karmaChanges.comments && karmaChanges.comments.map(commentChange => (
              <MenuItemUntyped className={classes.votedItemRow}
                component={Link} to={commentGetPageUrlFromIds({postId:commentChange.postId, postSlug:commentChange.postSlug, tagSlug:commentChange.tagSlug, commentId: commentChange._id})} key={commentChange._id}
                >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={commentChange.scoreChange} classes={classes}/>
                </span>
                <div className={classes.votedItemDescription}>
                  {commentChange.description}
                </div>
              </MenuItemUntyped>
            ))}
          </div>
        </div>
        }
      <Link to={`/account`} onClick={handleClose}>
        <span className={classes.settings}>Change Settings </span>
      </Link>
    </Components.Typography>
  );
}

interface ExternalProps {
  documentId: string,
}
interface KarmaChangeNotifierProps extends ExternalProps, WithUserProps, WithUpdateCurrentUserProps, WithStylesProps, WithTrackingProps {
  document: UserKarmaChanges
}
interface KarmaChangeNotifierState {
  cleared: boolean,
  open: boolean,
  anchorEl: HTMLElement|null,
  karmaChanges: any,
  karmaChangeLastOpened: Date,
}

class KarmaChangeNotifier extends PureComponent<KarmaChangeNotifierProps,KarmaChangeNotifierState> {
  state: KarmaChangeNotifierState = {
    cleared: false,
    open: false,
    anchorEl: null,
    karmaChanges: this.props.document?.karmaChanges,
    karmaChangeLastOpened: this.props.currentUser?.karmaChangeLastOpened || new Date(),
  };

  handleOpen = (event) => {
    this.setState({
      open: true,
      anchorEl: event.currentTarget,
      karmaChangeLastOpened: new Date()
    });
  }

  handleToggle = (e) => {
    const { open } = this.state
    const { captureEvent } = this.props
    if (open) {
      this.handleClose(null) // When closing from toggle, force a close by not providing an event
    } else {
      this.handleOpen(e)
    }
    captureEvent("karmaNotifierToggle", {open: !open, karmaChangeLastOpened: this.state.karmaChangeLastOpened, karmaChanges: this.state.karmaChanges})
  }

  handleClose = (e) => {
    const { document, updateCurrentUser, currentUser } = this.props;
    const { anchorEl } = this.state
    if (e && anchorEl?.contains(e.target)) {
      return;
    }
    this.setState({
      open: false,
      anchorEl: null,
    });
    if (!currentUser) return;
    if (document?.karmaChanges) {
      void updateCurrentUser({
        karmaChangeLastOpened: document.karmaChanges.endDate,
        karmaChangeBatchStart: document.karmaChanges.startDate
      });

      if (document.karmaChanges.updateFrequency === "realtime") {
        this.setState({cleared: true});
      }
    }
  }

  render() {
    const {document, classes, currentUser} = this.props;
    if (!currentUser || !document) return null
    const {open, anchorEl, karmaChanges: stateKarmaChanges, karmaChangeLastOpened} = this.state;
    const karmaChanges = stateKarmaChanges || document.karmaChanges; // Covers special case when state was initialized when user wasn't logged in
    if (!karmaChanges) return null;

    const { karmaChangeNotifierSettings: settings } = currentUser
    if (settings && settings.updateFrequency === "disabled")
      return null;

    const { posts, comments, endDate, totalChange } = karmaChanges
    //Check if user opened the karmaChangeNotifications for the current interval
    const newKarmaChangesSinceLastVisit = new Date(karmaChangeLastOpened || 0) < new Date(endDate || 0)
    const starIsHollow = ((comments.length===0 && posts.length===0) || this.state.cleared || !newKarmaChangesSinceLastVisit)

    return <AnalyticsContext pageSection="karmaChangeNotifer">
      <div className={classes.root}>
        <IconButton onClick={this.handleToggle} className={classes.karmaNotifierButton}>
          {starIsHollow
            ? <StarBorderIcon className={classes.starIcon}/>
            : <Badge badgeContent={<span className={classes.pointBadge}><ColoredNumber n={totalChange} classes={classes}/></span>}>
                <StarIcon className={classes.starIcon}/>
              </Badge>
          }
        </IconButton>
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-end"
          className={classes.karmaNotifierPopper}
          popperOptions={{
            // Don't use CSS transform3d to position the popper, because that
            // causes blurry text under some circumstances
            modifiers: {
              computeStyle: {
                gpuAcceleration: false,
              }
            }
          }}
        >
          <ClickAwayListener onClickAway={this.handleClose}>
            <Paper className={classes.karmaNotifierPaper}>
              <KarmaChangesDisplay karmaChanges={karmaChanges} classes={classes} handleClose={this.handleClose} />
            </Paper>
          </ClickAwayListener>
        </Popper>
      </div>
    </AnalyticsContext>
  }
}

const KarmaChangeNotifierComponent = registerComponent<ExternalProps>('KarmaChangeNotifier', KarmaChangeNotifier, {
  styles,
  hocs: [
    withUser, withErrorBoundary,
    withSingle({
      collection: Users,
      fragmentName: 'UserKarmaChanges'
    }),
    withUpdateCurrentUser,
    withTracking
  ]
});

declare global {
  interface ComponentTypes {
    KarmaChangeNotifier: typeof KarmaChangeNotifierComponent
  }
}
