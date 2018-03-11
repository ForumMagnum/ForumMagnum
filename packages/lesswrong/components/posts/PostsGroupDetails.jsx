import { Components , registerComponent, withDocument } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import { Localgroups } from '../../lib/index.js';


class PostsGroupDetails extends Component {
  render() {
    const post = this.props.post;
    if (this.props.document) {
      return <div className="posts-page-group-details">
        <div className="sequences-navigation-title">
          {post && post.groupId && <Link to={'/groups/' + post.groupId }>{ this.props.document.name }</Link>}
        </div>
      </div>
    } else {
      return null
    }
  }
}

const options = {
  collection: Localgroups,
  queryName: "PostsGroupDetailsQuery",
  fragmentName: 'localGroupsHomeFragment',
  totalResolver: false,
  enableCache: true,
}

registerComponent( 'PostsGroupDetails', PostsGroupDetails, [withDocument, options]);
