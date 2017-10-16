import { Components, registerComponent, withCurrentUser, withList, withEdit } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";
import React, { Component } from 'react';
import IconButton from 'material-ui/IconButton';
import Popover from 'material-ui/Popover';
import {List, ListItem} from 'material-ui/List';
import PropTypes from 'prop-types';
// import { NavDropdown, MenuItem } from 'react-bootstrap';
import { Link } from 'react-router';
import Notifications from '../../lib/collections/notifications/collection.js'
import NotificationsIcon from 'material-ui/svg-icons/social/notifications-none';

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

  renderNotificationResults = () => {
    const {currentUser, results, loadMore, loading, totalCount} = this.props;
    if (results && !loading) {
      return <div>
        {results.map(notification =>
          <ListItem
            containerElement={<Link to={notification.link} />}
            onTouchTap={() => this.viewNotifications([notification])}
            key={notification._id}
            primaryText={notification.message}
            currentUser={currentUser}
            style={{backgroundColor: notification.viewed ? 'rgba(0,0,0,0.04)' : 'inherit'}}
          />)}

        {results.length < totalCount ?
          loading ?
            <Components.Loading /> :
            <ListItem onClick={() => loadMore()} primaryText="Load More" style={{textAlign: 'center', fontSize: '14px'}} />
          : null
        }
      </div>
    } else {
      return <Components.Loading />
    }
  }

  viewNotifications = (results) => {
    if(results && results.length){
      let editMutation = this.props.editMutation;
      let set = {viewed: true};
      results.forEach((notification) => {
        console.log(notification);
        editMutation({documentId: notification._id, set: set, unset: {}});
        notification.viewed = true;
      });
    }
  }

  render() {
      let results = this.props.results;
      const currentUser = this.props.currentUser;
      const refetch = this.props.refetch;
      const loading = this.props.loading;
      const loadMore = this.props.loadMore;
      const totalCount = this.props.totalCount;
      const title = this.props.title;

      const notificationStyle = {
        color: this.props.color
      }

      if (!currentUser) {
        return null;
      } else if (loading || !results) {
          return (<Components.Loading/>)
      } else {
        results = this.props.results.map(_.clone); //We don't want to modify the original results we get
        return (
          <div className="notifications-menu">
            <IconButton onTouchTap={(e) => {this.handleTouchTap(e)}} iconStyle={ notificationStyle }>
              <NotificationsIcon />
            </IconButton>
            <Popover
              open={this.state.open}
              anchorEl={this.state.anchorEl}
              anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
              targetOrigin={{horizontal: 'right', vertical: 'top'}}
              onRequestClose={this.handleRequestClose}
              autoCloseWhenOffScreen={false}
            >
              <div className="notifications-menu-content">
                <div className="notifications-menu-top">
                  <span className="notifications-menu-header">Notifications</span>
                  <span className="notifications-menu-actions">
                    {results && results.length ? <a className="notifications-menu-read-all" onTouchTap={() => this.viewNotifications(results)}>Mark All as Read</a> : null}
                    <Link to={Users.getProfileUrl(currentUser) + "/edit"} className="notifications-menu-settings">Settings</Link>
                  </span>
                </div>
                <List style={{width: '300px', maxHeight: '50vh', overflowY: 'auto', padding: '0px'}}>
                  { results && results.length ?
                    this.renderNotificationResults() :
                    <ListItem primaryText="No Results" disabled={true} containerElement={<Link to={{pathname: '/inbox', query: {select: "Notifications"}}}/>} />
                  }
                </List>
                <Link to={{pathname: '/inbox', query: {select: "Notifications"}}} className="notifications-menu-inbox-button" onTouchTap={() => this.setState({open: false})}>
                  <div className="notifications-menu-inbox-button-text">
                    All Notifications
                  </div>
                </Link>
              </div>
            </Popover>
          </div>
        )
      }
  }


}

NotificationsMenu.propTypes = {
  color: PropTypes.string,
};

NotificationsMenu.defaultProps = {
  color: "rgba(0, 0, 0, 0.6)"
}

const withListOptions = {
  collection: Notifications,
  queryName: 'notificationsListQuery',
  fragmentName: 'notificationsNavFragment',
  limit: 10,
  totalResolver: true,
};

const withEditOptions = {
  collection: Notifications,
  fragmentName: 'notificationsNavFragment',
};


registerComponent('NotificationsMenu', NotificationsMenu, [withList, withListOptions], [withEdit, withEditOptions], withCurrentUser);
