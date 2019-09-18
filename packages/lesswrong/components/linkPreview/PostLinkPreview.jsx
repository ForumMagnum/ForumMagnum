import React from 'react';
import { Components, registerComponent, useSingle, getSetting } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments';
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
  
  return <Components.PostLinkPreviewVariantCheck post={post} targetLocation={targetLocation} error={error} href={href} innerHTML={innerHTML} />
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
  
  return <Components.PostLinkPreviewVariantCheck post={post} targetLocation={targetLocation} error={error} href={href} innerHTML={innerHTML} />
}
registerComponent('PostLinkPreviewSequencePost', PostLinkPreviewSequencePost);

const PostLinkPreviewSlug = ({href, targetLocation, innerHTML}) => {
  const slug = targetLocation.params.slug;
  const { post, error } = usePostBySlug({ slug });
  
  return <Components.PostLinkPreviewVariantCheck href={href} innerHTML={innerHTML} post={post} targetLocation={targetLocation} error={error} />
}
registerComponent('PostLinkPreviewSlug', PostLinkPreviewSlug);

const PostLinkPreviewLegacy = ({href, targetLocation, innerHTML}) => {
  const legacyId = targetLocation.params.id;
  const { post, error } = usePostByLegacyId({ legacyId });
  
  return <Components.PostLinkPreviewVariantCheck href={href} innerHTML={innerHTML} post={post} targetLocation={targetLocation} error={error} />
}
registerComponent('PostLinkPreviewLegacy', PostLinkPreviewLegacy);

const PostLinkPreviewVariantCheck = ({ href, innerHTML, post, targetLocation, comment, commentId, error }) => {
  if (targetLocation.query.commentId) {
    return <PostLinkCommentPreview commentId={targetLocation.query.commentId} href={href} innerHTML={innerHTML} post={post} />
  }
  if (targetLocation.hash) {
    const commentId = targetLocation.hash.split("#")[1] 
    return <PostLinkCommentPreview commentId={commentId} href={href} innerHTML={innerHTML} post={post} />
  }

  if (commentId) {
    return <Components.PostLinkCommentPreview commentId={commentId} href={href} innerHTML={innerHTML}/>
  }

  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} />
}
registerComponent('PostLinkPreviewVariantCheck', PostLinkPreviewVariantCheck);


const styles = theme => ({
  link: {
    '&&': {
      position: "relative",
      color: theme.palette.secondary.main
    }
  },
  indicator: {
    position: "absolute",
    width: 20,
    fontSize: 8,
    display: "inline-block",
    color: theme.palette.primary.main,
    cursor: "pointer",
  }
})

const PostLinkCommentPreview = ({href, commentId, post, innerHTML}) => {

  const { document: comment, error } = useSingle({
    collection: Comments,
    queryName: "commentLinkPreview",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-then-network',
    documentId: commentId,
  });
  
  if (comment) {
    return <Components.CommentLinkPreviewWithComment comment={comment} post={post} error={error} href={href} innerHTML={innerHTML} />
  }
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} />

}
registerComponent('PostLinkCommentPreview', PostLinkCommentPreview);

const PostLinkPreviewWithPost = ({classes, href, innerHTML, post, anchorEl, hover}) => {
  const { PostsPreviewTooltip, LWPopper } = Components
  const linkElement = <span className={classes.linkElement}>
      <Link className={classes.link} to={href} dangerouslySetInnerHTML={{__html: innerHTML}}/>
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
        <PostsPreviewTooltip post={post} showAllinfo wide truncateLimit={900} hideOnMedium={false}/>
      </LWPopper>
      {linkElement}
    </span>
  );
}
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, withHover, withStyles(styles, {name:"PostLinkPreviewWithPost"}));

const CommentLinkPreviewWithComment = ({classes, href, innerHTML, comment, post, anchorEl, hover}) => {
  const { PostsPreviewTooltip, LWPopper } = Components
  const linkElement = <span className={classes.linkElement}>
      <Link className={classes.link} to={href} dangerouslySetInnerHTML={{__html: innerHTML}}/>
    </span>

  if (!comment) {
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
        <PostsPreviewTooltip post={post} comment={comment} showAllinfo wide truncateLimit={900} hideOnMedium={false}/>
      </LWPopper>
      {linkElement}
    </span>
  );
}
registerComponent('CommentLinkPreviewWithComment', CommentLinkPreviewWithComment, withHover, withStyles(styles, {name:"CommentLinkPreviewWithComment"}));

const defaultPreviewStyles = theme => ({
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

const DefaultPreview = ({classes, href, innerHTML, anchorEl, hover, onsite=false}) => {
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

      {onsite ?
        <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}} /> 
        :
        <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} />}
    </span>
  );
}
registerComponent('DefaultPreview', DefaultPreview, withHover, withStyles(defaultPreviewStyles, {name:"DefaultPreview"}));
