import React from 'react';
import { registerComponent, withDocument, getSetting } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper';
import mapProps from 'recompose/mapProps';
import { withLocation } from '../../lib/routeUtil';
import Posts from '../../lib/collections/posts/collection.js';
import { Helmet } from 'react-helmet';
import { withStyles } from '@material-ui/core/styles';
import { styles } from '../common/HeaderSubtitle';

const PostsPageHeaderTitle = ({location, isSubtitle, siteName, loading, document, classes}) => {
  if (!document || loading) return null;
  const post = document;
  
  if (!isSubtitle)
    return <Helmet><title>{`${post.title} - ${siteName}`}</title></Helmet>
  
  if (getSetting('forumType') !== 'AlignmentForum' && post?.af) {
    // TODO: A (broken) bit of an earlier iteration of the header subtitle
    // tried to made AF posts have a subtitle which said "AGI Alignment" and
    // linked to /alignment. But that bit of code was broken, and also that URL
    // is invalid. Maybe make a sensible place for it to link to, then put it
    // back? (alignment-forum.org isn't necessarily good to link to, because
    // it's invite-only.)
    return null;
  } else if (post?.frontpageDate) {
    return null;
  } else if (post?.meta) {
    return (<span className={classes.subtitle}>
      <Link to="/meta">Meta</Link>
    </span>);
  } else if (post?.userId) {
    // TODO: For personal blogposts, put the user in the sutitle. There was an
    // attempt to do this in a previous implementation, which didn't work.
    return null;
  }
}
registerComponent("PostsPageHeaderTitle", PostsPageHeaderTitle,
  withLocation,
  mapProps((props) => {
    const {location} = props;
    const {params: {_id}} = location;
    return {
      documentId: _id,
      ...props
    }
  }),
  [withDocument, {
    collection: Posts,
    fragmentName: "PostsBase",
    ssr: true,
  }],
  withStyles(styles, {name: "PostsPageHeaderTitle"})
);
