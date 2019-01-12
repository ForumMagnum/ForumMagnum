import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';

const styles = theme => ({
  karmaNotifierButton: {
  },
  karmaNotifierPopover: {
    padding: 10,
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
  }
  
  handleRequestClose = () => {
    this.setState({
      open: false,
      anchorEl: null,
    });
  }
  
  render() {
    const {classes, currentUser} = this.props;
    if (!currentUser) return null;
    const karmaChanges = currentUser.karmaChanges;
    
    return (<React.Fragment>
      <Button onClick={this.handleClick} className={classes.karmaNotifierButton}>
        {karmaChanges.totalChange > 0 && "+"+karmaChanges.totalChange}
        {karmaChanges.totalChange <= 0 && karmaChanges.totalChange}
      </Button>
      <Popover
        open={this.state.open}
        anchorEl={this.state.anchorEl}
        anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
        onClose={this.handleRequestClose}
      >
        <div className={classes.karmaNotifierPopover}>
          Karma changes between {karmaChanges.startDate} and {karmaChanges.endDate}
          
          <ul>
            {karmaChanges.posts && karmaChanges.posts.map((postChange,i) => (
              <li key={"post"+i}>
                {postChange.scoreChange}
                {postChange.post.title}
              </li>
            ))}
            {karmaChanges.comments && karmaChanges.comments.map((commentChange,i) => (
              <li key={"comment"+i}>
                {commentChange.scoreChange}
                {commentChange.comment.body}
              </li>
            ))}
          </ul>
        </div>
      </Popover>
    </React.Fragment>);
  }
}

registerComponent('KarmaChangeNotifier', KarmaChangeNotifier,
  withUser, withErrorBoundary,
  withStyles(styles, {name: 'KarmaChangeNotifier'}));