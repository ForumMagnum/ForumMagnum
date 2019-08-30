import React from 'react';
import { Components, registerComponent, useSingle } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Link } from 'react-router-dom';
import Tooltip from '@material-ui/core/Tooltip';
import { usePostBySlug, usePostByLegacyId } from '../posts/usePost.js';
import { withStyles } from '@material-ui/core/styles';
import { postHighlightStyles } from '../../themes/stylePiping'

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

const postsLinkPreviewCardStyles = theme => ({
  tooltip: {
  }
})

// COPY PASTE from Tooltip. Make sure to cleanup
const PostsLinkPreviewCard = ({classes, post}) => {  
  const { PostsUserAndCoauthors } = Components
  const postCategory = getPostCategory(post)
  const { wordCount = 0, htmlHighlight = "" } = post.contents || {}

  const highlight = truncate(htmlHighlight, 600)

  return <div className={classes.root}>
    <div>
      {post.title}
    </div>
    <div className={classes.tooltipInfo}>
      {postCategory}
      { author && post.user && <span> by <PostsUserAndCoauthors post={post}/></span>}
    </div>
    <div dangerouslySetInnerHTML={{__html:highlight}}
      className={classes.highlight} />
    {(wordCount > 0) && <div className={classes.tooltipInfo}>
      {wordCount} words (approx. {Math.ceil(wordCount/300)} min read)
    </div>}
  </div>
}
registerComponent('PostsLinkPreviewCard', PostsLinkPreviewCard, withStyles(postsLinkPreviewCardStyles, {name:"PostsLinkPreviewCard"}));


// COPY PASTE from SingleLineComment
const postLinkPreviewWithPostStyles = theme => ({
  tooltip: {
    backgroundColor: "white",
    color: theme.palette.grey[900],
    opacity: 1,
    width: 650,
    ...postHighlightStyles(theme),
    padding: theme.spacing.unit*1.5,
    border: "solid 1px rgba(0,0,0,.1)",
    boxShadow: "0 0 10px rgba(0,0,0,.2)",
    '& img': {
      maxHeight: "200px"
    }
  }
})

const PostLinkPreviewWithPost = ({classes, href, innerHTML, post, error}) => {
  const linkElement = <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}}/>;
  if (!post) {
    return linkElement;
  }
  
  return (
    <Tooltip
      title={
        error
          ? error
          : <Components.postsLinkPreviewCardStyles post={post} />
      }
      classes={{tooltip:classes.tooltip}}
      TransitionProps={{ timeout: 0 }}
      placement="bottom-start"
      enterDelay={0}
      PopperProps={{ style: { pointerEvents: 'none' } }}
    >
      {linkElement}
    </Tooltip>
  );
}
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, withStyles(postLinkPreviewWithPostStyles, {name:"PostLinkPreviewWithPost"}));