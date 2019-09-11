import React from 'react';
import { Components, registerComponent, useSingle, getSetting } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Link } from 'react-router-dom';
import { usePostBySlug, usePostByLegacyId } from '../posts/usePost.js';
import withHover from '../common/withHover';
import Popper from '@material-ui/core/Popper';
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

const styles = theme => ({
  popper: {
    zIndex: 5,
    position: "absolute"
  },
  link: {
    position: "relative",
    marginRight: 12,
  },
  indicator: {
    position: "absolute",
    bottom: 6,
    width: 20,
    fontSize: 8,
    display: "inline-block",
    fontWeight: 700,
    color: theme.palette.primary.main,
    cursor: "pointer",
  }
})

const siteTwoLetter = getSetting('forumType') === 'EAForum' ? 'EA' : 'LW'

const PostLinkPreviewWithPost = ({classes, href, innerHTML, post, anchorEl, hover}) => {
  const { PostsItemTooltip } = Components
  const linkElement = <span className={classes.linkElement}>
      <Link className={classes.link} to={href}>
        <span dangerouslySetInnerHTML={{__html: innerHTML}}></span>{}<span className={classes.indicator}>{siteTwoLetter}</span>
      </Link>
    </span>
  if (!post) {
    return linkElement;
  }
  return (
    <span>
      <Popper open={hover} anchorEl={anchorEl} placement="bottom" className={classes.popper}>
        <PostsItemTooltip post={post} showAllinfo wide truncateLimit={900}/>
      </Popper>
      {linkElement}
    </span>
  );
}
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, withHover, withStyles(styles, {name:"PostLinkPreviewWithPost"}));
