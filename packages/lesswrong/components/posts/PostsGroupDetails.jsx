import { registerComponent, withDocument } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Link } from 'react-router';
import { Localgroups } from '../../lib/index.js';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  title: {
    display: 'inline-block',
    fontSize: 22,
    verticalAlign: '-webkit-baseline-middle',
    fontVariant: 'small-caps',
    lineHeight: '24px',
    color: 'rgba(0,0,0,0.5)',
    marginTop: -10,
  },
  root: {
    marginBottom: 10, 
    marginTop: 10
  }
})

class PostsGroupDetails extends Component {
  render() {
    const { post, classes, document } = this.props
    if (document) {
      return <div className={classes.root}>
        <div className={classes.title}>
          {post && post.groupId && <Link to={'/groups/' + post.groupId }>{ document.name }</Link>}
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
  enableTotal: false,
  enableCache: true,
  ssr: true,
}

registerComponent( 'PostsGroupDetails', PostsGroupDetails, [withDocument, options], withStyles(styles, {name: "PostsGroupDetails"}));
