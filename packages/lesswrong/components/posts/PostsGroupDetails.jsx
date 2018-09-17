import { Components, withDocument } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import { Localgroups } from '../../lib/index.js';
import defineComponent from '../../lib/defineComponent';


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

export default defineComponent({
  name: 'PostsGroupDetails',
  component: PostsGroupDetails,
  hocs: [ [withDocument, options] ]
});
