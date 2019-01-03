import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import Users from 'meteor/vulcan:users';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';


const styles = theme => ({
  view: {
    color: theme.palette.primary.light,
    fontWeight: 600,
  },
  filter: {
    cursor: "pointer",
    color: theme.palette.grey[400],
    '&:hover': {
      opacity:.7
    }
  },
  selected: {
    color: theme.palette.grey[800],
  },
})

class PostsViews extends Component {
  constructor(props) {
    super(props);
    const query = props.router.location.query
    this.state = {
      anchorEl: null,
      view: query && query.view || "new",
      filter: query && query.filter
    }
  }

  handleSortClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  setFilter = (filter) => {
    this.setState({filter:filter})
    this.handleViewClick(this.state.view, filter)
  }

  handleViewClick = (view, filter) => {
    const { router, post } = this.props

    let newState = { anchorEl: null }
    if (view) {
      newState.view = view
    }
    this.setState(newState)

    const currentQuery = (!_.isEmpty(router.location.query) && router.location.query) ||  {view: 'new'}

    let query = {
      ...currentQuery,
      view: view || this.state.view,
      postId: post ? post._id : undefined,
      filter: filter || this.state.filter
    }
    router.replace({...router.location, query: query})
  };

  handleClose = () => {
    this.setState({ anchorEl: null })
  }

  render () {
    const { currentUser, router, classes } = this.props
    const { anchorEl, filter } = this.state

    let views = ['magic', 'new', 'old', 'top', 'unread'];
    const adminViews = [
      // 'pending', 'rejected', 'scheduled'
    ];

    if (Users.canDo(currentUser, 'posts.edit.all')) {
      views = views.concat(adminViews);
    }
    const query = _.clone(router.location.query);
    const currentView = query && query.view || "new"

    return (
      <div>
        sorted by <a className={classes.view} onClick={this.handleSortClick}>{ currentView }</a>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
        >
          {views.map(view => {
            return(
              <MenuItem key={view} onClick={() => this.handleViewClick(view)}>
                { view }
              </MenuItem>)})}
        </Menu>
        <div> —–––— </div>
        <div className={classNames(classes.filter, {[classes.selected]:filter==="all"})} onClick={()=>this.setFilter("all")}>
          All
        </div>
        <div className={classNames(classes.filter, {[classes.selected]:filter==="curated"})} onClick={()=>this.setFilter("curated")}>
          Curated
        </div>
        <div className={classNames(classes.filter, {[classes.selected]:filter==="frontpage"})} onClick={()=>this.setFilter("frontpage")}>
          Frontpage
        </div>
        <div className={classNames(classes.filter, {[classes.selected]:filter==="questions"})} onClick={()=>this.setFilter("questions")}>
          Questions
        </div>
        <div className={classNames(classes.filter, {[classes.selected]:filter==="events"})} onClick={()=>this.setFilter("events")}>
          Events
        </div>
        <div className={classNames(classes.filter, {[classes.selected]:filter==="meta"})} onClick={()=>this.setFilter("meta")}>
          Meta
        </div>
      </div>
    );
  }
}

PostsViews.propTypes = {
  currentUser: PropTypes.object,
  defaultView: PropTypes.string,
};

PostsViews.defaultProps = {
  defaultView: 'top',
};

PostsViews.contextTypes = {
  currentRoute: PropTypes.object,
};

PostsViews.displayName = 'PostsViews';

registerComponent('PostsViews', PostsViews, withCurrentUser, withRouter, withStyles(styles, {name:"PostsViews"}));
