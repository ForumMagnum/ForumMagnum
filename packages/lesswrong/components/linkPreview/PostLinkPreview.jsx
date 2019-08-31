import React from 'react';
import { Components, registerComponent, useSingle } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Link } from 'react-router-dom';
import { usePostBySlug, usePostByLegacyId } from '../posts/usePost.js';
import { withStyles } from '@material-ui/core/styles';

const PostLinkPreview = ({href, targetLocation, innerHTML}) => {
  const postID = targetLocation.params._id;
  
  const { document: post, error } = useSingle({
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',
    
    documentId: postID,
  });
  
  return <Components.PostLinkPreviewWithPost post={post} error={error} href={href} innerHTML={innerHTML} />
}
registerComponent('PostLinkPreview', PostLinkPreview);

const PostLinkPreviewSequencePost = ({href, targetLocation, innerHTML}) => {
  const postID = targetLocation.params.postId;
  
  const { document: post, error } = useSingle({
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',
    
    documentId: postID,
  });
  
  return <Components.PostLinkPreviewWithPost post={post} error={error} href={href} innerHTML={innerHTML} />
}
registerComponent('PostLinkPreviewSequencePost', PostLinkPreviewSequencePost);

const PostLinkPreviewSlug = ({href, targetLocation, innerHTML}) => {
  const slug = targetLocation.params.slug;
  const { post, error } = usePostBySlug({ slug });
  
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} />
}
registerComponent('PostLinkPreviewSlug', PostLinkPreviewSlug);

const PostLinkPreviewLegacy = ({href, targetLocation, innerHTML}) => {
  const legacyId = targetLocation.params.id;
  const { post, error } = usePostByLegacyId({ legacyId });
  
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} />
}
registerComponent('PostLinkPreviewLegacy', PostLinkPreviewLegacy);

const postLinkPreviewWithPostStyles = theme => ({
  root: {
    position: "relative",
    '&:hover $hoverOver': {
      display:"block"
    }
  },
  popper: {
    opacity: 1,
  },
  tooltip: {
    background: "none",
  },
  hoverOver: {
    display: "none",
    position: "absolute",
    zIndex: 5,
    top: 20,
    [theme.breakpoints.up('sm')]: {
      marginLeft: 50
    }
  }
})

const PostLinkPreviewWithPost = ({classes, href, innerHTML, post, error}) => {
  const { PostsItemTooltip } = Components
  const linkElement = <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}}/>;
  if (!post) {
    return linkElement;
  }
  
  return (
    <span className={classes.root}>
      <div className={classes.hoverOver}>
        <PostsItemTooltip post={post} showCategory showAuthor showKarma showComments showTitle wide truncateLimit={900}/>
      </div>
      {linkElement}
    </span>
  );
}
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, withStyles(postLinkPreviewWithPostStyles, {name:"PostLinkPreviewWithPost"}));