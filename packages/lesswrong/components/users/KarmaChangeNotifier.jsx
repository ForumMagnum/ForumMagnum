import React, { PureComponent } from 'react';
import { registerComponent, withDocument, withUpdate } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import Popper from '@material-ui/core/Popper';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import { Link } from 'react-router-dom';
import Users from 'meteor/vulcan:users';
import Typography from '@material-ui/core/Typography';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Badge from '@material-ui/core/Badge';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import { getHeaderTextColor } from '../common/Header';
import MenuItem from '@material-ui/core/MenuItem';
import { karmaNotificationTimingChoices } from './KarmaChangeNotifierSettings'
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments';

const styles = theme => ({
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
    width: 20,
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
const ColoredNumber = ({n, classes}) => {
  if (n>0) {
    return <span className={classes.gainedPoints}>{`+${n}`}</span>
  } else if (n==0) {
    return <span className={classes.zeroPoints}>{n}</span>
  } else {
    return <span className={classes.lostPoints}>{n}</span>
  }
}

const KarmaChangesDisplay = ({karmaChanges, classes, handleClose }) => {
  const { posts, comments, updateFrequency } = karmaChanges
  const noKarmaChanges = !((posts && (posts.length > 0)) || (comments && (comments.length > 0)))
  return (
    <Typography variant="body1">
      {noKarmaChanges ?
        <span className={classes.title}>{ karmaNotificationTimingChoices[updateFrequency].emptyText }</span>
        :
        <div>
          <span className={classes.title}>{ karmaNotificationTimingChoices[updateFrequency].infoText }</span>
          <div className={classes.votedItems}>
            {karmaChanges.posts && karmaChanges.posts.map(postChange => (
              <MenuItem
                className={classes.votedItemRow}
                component={Link} to={Posts.getPageUrl(postChange)} key={postChange._id} >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={postChange.scoreChange} classes={classes}/>
                </span>
                <div className={classes.votedItemDescription}>
                  {postChange.title}
                </div>
                </MenuItem>
            ))}
            {karmaChanges.comments && karmaChanges.comments.map(commentChange => (
              <MenuItem className={classes.votedItemRow}
                component={Link} to={Comments.getPageUrlFromIds({postId:commentChange.postId, postSlug:commentChange.postSlug, commentId: commentChange._id})} key={commentChange._id}
                >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={commentChange.scoreChange} classes={classes}/>
                </span>
                <div className={classes.votedItemDescription}>
                  {commentChange.description}
                </div>
              </MenuItem>
            ))}
          </div>
        </div>
        }
      <Link to={`/account`} onClick={handleClose}>
        <span className={classes.settings}>Change Settings </span>
      </Link>
    </Typography>
  );
}

class KarmaChangeNotifier extends PureComponent {
  state = {
    cleared: false,
    open: false,
    anchorEl: null,
    karmaChanges: this.props.document && this.props.document.karmaChanges,
    karmaChangeLastOpened: this.props.currentUser && this.props.currentUser.karmaChangeLastOpened
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
    if (open) {
      this.handleClose() // When closing from toggle, force a close by not providing an event
    } else {
      this.handleOpen(e)
    }
  }

  handleClose = (e) => {
    const { anchorEl } = this.state
    if (e && anchorEl.contains(e.target)) {
      return;
    }
    this.setState({
      open: false,
      anchorEl: null,
    });
    if (this.props.document && this.props.document.karmaChanges) {
      this.props.updateUser({
        selector: {_id: this.props.currentUser._id},
        data: {
          karmaChangeLastOpened: this.props.document.karmaChanges.endDate,
          karmaChangeBatchStart: this.props.document.karmaChanges.startDate
        }
      });

      if (this.props.document.karmaChanges.updateFrequency === "realtime") {
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
    const newKarmaChangesSinceLastVisit = (new Date(karmaChangeLastOpened || 0) - new Date(endDate || 0)) < 0
    const starIsHollow = ((comments.length===0 && posts.length===0) || this.state.cleared || !newKarmaChangesSinceLastVisit)

    return <div className={classes.root}>
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
  }
}

registerComponent('KarmaChangeNotifier', KarmaChangeNotifier,
  withUser, withErrorBoundary,
  [withDocument, {
    collection: Users,
    queryName: 'UserKarmaChangesQuery',
    fragmentName: 'UserKarmaChanges'
  }],
  [withUpdate, {
    collection: Users,
    fragmentName: 'UsersCurrent',
  }],
  withStyles(styles, {name: 'KarmaChangeNotifier'})
);
