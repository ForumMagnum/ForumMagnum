import React, { PureComponent } from 'react';
import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import Popper from '@material-ui/core/Popper';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import { Link } from 'react-router';
import Users from 'meteor/vulcan:users';
import Typography from '@material-ui/core/Typography';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Badge from '@material-ui/core/Badge';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import { getHeaderTextColor } from '../common/Header';

const styles = theme => ({
  karmaNotifierButton: {
  },
  karmaNotifierPaper: {
    padding: 10,
  },
  karmaNotifierPopper: {
    zIndex: 10000,
  },
  starIcon: {
    color: getHeaderTextColor(theme),
  },
  
  votedItems: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  votedItemRow: {
  },
  votedItemScoreChange: {
    display: "inline-block",
    width: 20,
    textAlign: "right",
  },
  votedItemDescription: {
    display: "inline-block",
    marginLeft: 5,
  },
  
  singleLinePreview: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    display: "inline-block",
    maxWidth: 300,
    
    verticalAlign: "middle",
    position: "relative",
    top: -1,
  },
  
  gainedPoints: {
    color: theme.palette.primary.main,
  },
  zeroPoints: {
  },
  lostPoints: {
    color: theme.palette.error.main,
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

const KarmaChangesDisplay = ({karmaChanges, classes}) => {
  const {FormatDate} = Components;
  return (
    <Typography variant="body2">
      Karma changes between <FormatDate date={karmaChanges.startDate}/> and <FormatDate date={karmaChanges.endDate}/>
      
      <div className={classes.votedItems}>
        {karmaChanges.posts && karmaChanges.posts.map((postChange,i) => (
          <div className={classes.votedItemRow} key={"post"+i}>
            <div className={classes.votedItemScoreChange}>
              <ColoredNumber n={postChange.scoreChange} classes={classes}/>
            </div>
            <div className={classes.votedItemDescription}>
              <Link to={postChange.post.pageUrlRelative} className={classes.singleLinePreview}>
                {postChange.post.title}
              </Link>
            </div>
          </div>
        ))}
        {karmaChanges.comments && karmaChanges.comments.map((commentChange,i) => (
          <div className={classes.votedItemRow} key={"comment"+i}>
            <div className={classes.votedItemScoreChange}>
              <ColoredNumber n={commentChange.scoreChange} classes={classes}/>
            </div>
            <div className={classes.votedItemDescription}>
              <Link to={commentChange.comment.pageUrlRelative} className={classes.singleLinePreview}>
                {commentChange.comment.plaintextExcerpt}>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Typography>
  );
}

class KarmaChangeNotifier extends PureComponent {
  state = {
    cleared: false,
    open: false,
    anchorEl: null,
  };
  
  handleOpen = (event) => {
    this.setState({
      open: true,
      anchorEl: event.currentTarget
    });
    if (this.props.currentUser && this.props.currentUser.karmaChanges) {
      this.props.editMutation({
        documentId: this.props.currentUser._id,
        set: {
          karmaChangeLastOpened: this.props.currentUser.karmaChanges.endDate,
          karmaChangeBatchStart: this.props.currentUser.karmaChanges.startDate
        }
      });
      
      if (this.props.currentUser.karmaChanges.updateFrequency === "realtime") {
        this.setState({cleared: true});
      }
    }
  }
  
  handleClose = () => {
    this.setState({
      open: false,
      anchorEl: null,
    });
  }
  
  render() {
    const {classes, currentUser} = this.props;
    const {open, anchorEl} = this.state;
    if (!currentUser) return null;
    const karmaChanges = currentUser.karmaChanges;
    
    const settings = currentUser.karmaChangeNotifierSettings;
    if (settings && settings.updateFrequency === "disabled")
      return null;
    
    return <div>
      <IconButton onClick={this.handleOpen} className={classes.karmaNotifierButton}>
        {((karmaChanges.comments.length===0 && karmaChanges.posts.length===0) || this.state.cleared)
          ? <StarBorderIcon className={classes.starIcon}/>
          : <Badge badgeContent={<ColoredNumber n={karmaChanges.totalChange} classes={classes}/>}>
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
            <KarmaChangesDisplay karmaChanges={karmaChanges} classes={classes} />
          </Paper>
        </ClickAwayListener>
      </Popper>
    </div>;
  }
}

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

registerComponent('KarmaChangeNotifier', KarmaChangeNotifier,
  withUser, withErrorBoundary,
  [withEdit, withEditOptions],
  withStyles(styles, {name: 'KarmaChangeNotifier'})
);