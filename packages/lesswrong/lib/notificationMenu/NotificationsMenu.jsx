import { Components, registerComponent, withCurrentUser, withList, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import IconButton from 'material-ui/IconButton';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
// import { NavDropdown, MenuItem } from 'react-bootstrap';
import { Link } from 'react-router';
import Notifications from '../collections/notifications/collection.js'

class NotificationsMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    }
  }

  handleTouchTap = (event) => {
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
      const results = this.props.results;
      const currentUser = this.props.currentUser;
      const refetch = this.props.refetch;
      const loading = this.props.loading;
      const loadMore = this.props.loadMore;
      const totalCount = this.props.totalCount;
      const title = this.props.title;

      let unreadNotifications = [];
      if (results && results.length) {
        unreadNotifications = results.filter(this.isNotViewed);
      }
      // console.log(currentUser);
      // console.log(refetch);

      //TODO: Display Load More button only when not all notifications are loaded already
      if (!currentUser) {
        return null;
      } else if (results && results.length) {
        return (
          <div className="users-menu">
            <IconButton onTouchTap={this.handleTouchTap} iconClassName="notifications_none" />
            <Popover
              open={this.state.open}
              anchorEl={this.state.anchorEl}
              anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
              targetOrigin={{horizontal: 'right', vertical: 'top'}}
              onRequestClose={this.handleRequestClose}
            >
              <Menu>
                <MenuItem primaryText="All Notifications" containerElement={<Link to={{pathname: '/inbox', query: {select: "Notifications"}}}/>} />
                {results.map(notification => <MenuItem key={notification._id} primaryText={notification.notificationMessage} currentUser={currentUser} notification={notification} />)}
              </Menu>
            </Popover>
          </div>
        )
      } else if (loading) {
          return (<Components.Loading/>)
      } else {
          return (
            <div className="users-menu">
              <IconButton onTouchTap={this.handleTouchTap} iconClassName="notifications_none" />
              <Popover
                open={this.state.open}
                anchorEl={this.state.anchorEl}
                anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                targetOrigin={{horizontal: 'right', vertical: 'top'}}
                onRequestClose={this.handleRequestClose}
              >
                <Menu>
                  <MenuItem primaryText="All Notifications" containerElement={<Link to={{pathname: '/inbox', query: {select: "Notifications"}}}/>} />
                  <MenuItem primaryText="No Results" disabled={true} containerElement={<Link to={{pathname: '/inbox', query: {select: "Notifications"}}}/>} />
                </Menu>
              </Popover>
            </div>)
      }
  }

  isNotViewed(notification) {
    return (!notification.viewed);
  }

  viewNotifications(results) {
    const VIEW_NOTIFICATIONS_DELAY = 500;
    return () => {
      return setTimeout(() => {
        if(results && results.length){
          let editMutation = this.props.editMutation;
          let set = {viewed: true};
          results.forEach((notification) => {
            // console.log(notification);
            editMutation({documentId: notification._id, set: set, unset: {}});
          });
        }
      }, VIEW_NOTIFICATIONS_DELAY)
    }
  }
}


const withListOptions = {
  collection: Notifications,
  queryName: 'notificationsListQuery',
  fragmentName: 'notificationsNavFragment',
  limit: 5,
  totalResolver: false,
};

const withEditOptions = {
  collection: Notifications,
  fragmentName: 'notificationsNavFragment',
};


registerComponent('NotificationsMenu', NotificationsMenu, [withList, withListOptions], [withEdit, withEditOptions], withCurrentUser);
