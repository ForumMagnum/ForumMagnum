import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from 'meteor/vulcan:i18n';
import { Link } from 'react-router';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import { withRouter } from 'react-router'
import Users from 'meteor/vulcan:users';


const viewNames = {
  'postCommentsTop': 'magical algorithm',
  'postCommentsNew': 'most recent',
  'postCommentsBest': 'highest karma',
  'postCommentsDeleted': 'deleted',
  'postCommentsSpam': 'spam',
  'postCommentsReported': 'reported',
}

const DropdownStyle = {
  textShadow: 'inherit',
  display: 'inline-block',
  fontSize: 'inherit',
  height: 'auto',
};

const DropdownUnderlineStyle = {
  display: 'none',
};

const DropdownIconStyle = {
  display: 'none',
};

const DropdownLabelStyle = {
  lineHeight: 'normal',
  overflow: 'inherit',
  paddingLeft: '0px',
  paddingRight: '0px',
  height: 'normal',
  color: 'inherit',
};

const DropdownListStyle = {
  paddingTop: '4px',
}

class CommentsViews extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: _.clone(props.router.location.query).view || "postCommentsTop"
    }
  }

  handleChange = (event, index, value) => this.setState({view: value});

  render() {
    const props = this.props;
    const router = props.router;
    let views = ["postCommentsTop", "postCommentsNew", "postCommentsBest"];
    const adminViews = ["postCommentsDeleted", "postCommentsSpam", "postCommentsReported"];

    const currentQuery = (!_.isEmpty(router.location.query) && router.location.query) ||  {view: 'postCommentsTop'};
    const currentLocation = router.location;

    if (Users.canDo(props.currentUser, "comments.softRemove.all")) {
      views = views.concat(adminViews);
    }
    return (
      <div className="comments-views">
        <DropDownMenu
          value={this.state.view}
          onChange={this.handleChange}
          maxHeight={150}
          style={DropdownStyle}
          underlineStyle={DropdownUnderlineStyle}
          iconStyle={DropdownIconStyle}
          labelStyle={DropdownLabelStyle}
          listStyle={DropdownListStyle}
          className="comments-views-dropdown"
        >
          {views.map(view => {
            return <MenuItem
                key={view}
                value={view}
                primaryText={viewNames[view]}
                onTouchTap={() => router.replace({...currentLocation, query: {...currentQuery, view: view, postId: props.postId}})}
                />
            }
          )}
        </DropDownMenu>
      </div>
  )}
}

CommentsViews.propTypes = {
  currentUser: PropTypes.object,
  defaultView: PropTypes.string
};

CommentsViews.defaultProps = {
  defaultView: "postCommentsTop"
};

CommentsViews.contextTypes = {
  currentRoute: PropTypes.object,
  intl: intlShape
};

CommentsViews.displayName = "PostsViews";

registerComponent('CommentsViews', CommentsViews, withRouter, withCurrentUser);
