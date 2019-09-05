import React from 'react';
import { Components, registerComponent, useSingle } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Link } from 'react-router-dom';
import { usePostBySlug, usePostByLegacyId } from '../posts/usePost.js';
import withHover from '../common/withHover';
import Card from '@material-ui/core/Card';
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

const PostLinkPreviewWithPost = ({classes, href, innerHTML, post, anchorEl, hover}) => {
  const { PostsItemTooltip, LWPopper } = Components
  const linkElement = <span className={classes.linkElement}>
      <Link className={classes.link} to={href}>
        <span dangerouslySetInnerHTML={{__html: innerHTML}}></span>{}<span className={classes.indicator}>LW</span>
      </Link>
    </span>
  if (!post) {
    return linkElement;
  }
  return (
    <span>
      <LWPopper 
        open={hover} 
        anchorEl={anchorEl} 
        placement="bottom"
        modifiers={{
          flip: {
            behavior: ["bottom", "top", "bottom"],
            boundariesElement: 'viewport'
          }
        }}
      >
        <PostsItemTooltip post={post} showAllinfo wide truncateLimit={900}/>
      </LWPopper>
      {linkElement}
    </span>
  );
}
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, withHover, withStyles(styles, {name:"PostLinkPreviewWithPost"}));

const offsiteStyles = theme => ({
  hovercard: {
    padding: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    ...theme.typography.body2,
    fontSize: "1.1rem",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600]
  },
})

const OffsitePreviewWithPost = ({classes, href, innerHTML, anchorEl, hover}) => {
  const { LWPopper } = Components
  return (
    <span>
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom">
        <Card>
          <div className={classes.hovercard}>
            {href}
          </div>
        </Card>
      </LWPopper>
      <a to={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
    </span>
  );
}
registerComponent('OffsitePreviewWithPost', OffsitePreviewWithPost, withHover, withStyles(offsiteStyles, {name:"OffsitePreviewWithPost"}));