import React, { PureComponent } from 'react';
import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router';
import Users from 'meteor/vulcan:users';

const styles = theme => ({
  karmaNotifierButton: {
  },
  karmaNotifierPopover: {
    padding: 10,
  },
  
  votedItems: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  votedItemRow: {
  },
  votedItemScoreChange: {
    display: "inline-block",
    width: 30,
    textAlign: "right",
  },
  votedItemDescription: {
    display: "inline-block",
    marginLeft: 5,
  },
});

class KarmaChangeNotifier extends PureComponent {
  state = {
    open: false,
    anchorEl: null,
  };
  
  handleClick = (event) => {
    this.setState({
      open: true,
      anchorEl: event.currentTarget,
    });
    this.props.editMutation({
      documentId: this.props.currentUser._id,
      set: {
        karmaChangeLastOpened: new Date()
      }
    });
  }
  
  handleRequestClose = () => {
    this.setState({
      open: false,
      anchorEl: null,
    });
  }
  
  // Given a number, return a string version of it which has a plus sign in
  // front if it's strictly positive. Ie "+1", "0", "-1" (rather than the usual
  // stringification, which would be "1", "0", "-1").
  numberToSignedString(n) {
    if (n>0)
      return "+"+n;
    else
      return ""+n;
  }
  
  render() {
    const {classes, currentUser} = this.props;
    const {FormatDate} = Components;
    if (!currentUser) return null;
    const karmaChanges = currentUser.karmaChanges;
    
    const settings = currentUser.karmaChangeNotifierSettings;
    if (settings && settings.updateFrequency === "disabled")
      return null;
    
    return (<React.Fragment>
      <Button onClick={this.handleClick} className={classes.karmaNotifierButton}>
        {this.numberToSignedString(karmaChanges.totalChange)}
      </Button>
      <Popover
        open={this.state.open}
        anchorEl={this.state.anchorEl}
        anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
        onClose={this.handleRequestClose}
      >
        <div className={classes.karmaNotifierPopover}>
          Karma changes between <FormatDate date={karmaChanges.startDate}/> and <FormatDate date={karmaChanges.endDate}/>
          
          <div className={classes.votedItems}>
            {karmaChanges.posts && karmaChanges.posts.map((postChange,i) => (
              <div className={classes.votedItemRow} key={"post"+i}>
                <div className={classes.votedItemScoreChange}>
                  {this.numberToSignedString(postChange.scoreChange)}
                </div>
                <div className={classes.votedItemDescription}>
                  <Link to={postChange.post.pageUrlRelative}>
                    {postChange.post.title}
                  </Link>
                </div>
              </div>
            ))}
            {karmaChanges.comments && karmaChanges.comments.map((commentChange,i) => (
              <div className={classes.votedItemRow} key={"comment"+i}>
                <div className={classes.votedItemScoreChange}>
                  {this.numberToSignedString(commentChange.scoreChange)}
                </div>
                <div className={classes.votedItemDescription}>
                  <Link to={commentChange.comment.pageUrlRelative}>
                    {commentChange.comment.body}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Popover>
    </React.Fragment>);
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