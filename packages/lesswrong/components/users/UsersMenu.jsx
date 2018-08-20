import { Components, registerComponent, withCurrentUser, getSetting } from 'meteor/vulcan:core';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';
import { Link } from 'react-router';
import Users from 'meteor/vulcan:users';
import { withApollo } from 'react-apollo';

import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import Button from '@material-ui/core/Button';

import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  userButton: {
    textTransform: 'none',
    fontSize: '16px',
  }
})

class UsersMenu extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    }
  }

  handleClick = (event) => {
    event.preventDefault();
    this.setState({
      open:true,
      anchorEl: event.currentTarget,
    });
  };

  handleRequestClose = () => {
    this.setState({
      open: false,
    });
  }

  render() {
    let { currentUser, client, classes, color } = this.props;

    return (
      <div className="users-menu">
        <Button onClick={this.handleClick}>
          <span className={classes.userButton} style={{ color: color }}>
            {Users.getDisplayName(currentUser)}
          </span>
        </Button>
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'right', vertical: 'top'}}
          onRequestClose={this.handleRequestClose}
        >
          <Menu className="users-menu-contents">
            { !getSetting('AlignmentForum')
                ? <MenuItem primaryText="New Post" containerElement={<Link to={`/newPost`}/>} />
                : Users.canDo(currentUser, 'posts.alignment.new')
                  ? <MenuItem primaryText="New Post" containerElement={<Link to={`/newPost`}/>} />
                  : null
            }
            <MenuItem primaryText="Profile" containerElement={<Link to={`/users/${currentUser.slug}`}/>} />
            <MenuItem primaryText="Edit Account" containerElement={<Link to={`/account`}/>} />
            <MenuItem primaryText="Log Out" onClick={() => Meteor.logout(() => client.resetStore())} />
          </Menu>
        </Popover>
      </div>
    )
  }
}

UsersMenu.propTypes = {
  color: PropTypes.string,
};

UsersMenu.defaultProps = {
  color: "rgba(0, 0, 0, 0.6)"
}

registerComponent('UsersMenu', UsersMenu, withCurrentUser, withApollo, withStyles(styles));
