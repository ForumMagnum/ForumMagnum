import React from 'react';
import { Components, registerComponent, useSingle } from 'meteor/vulcan:core';
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
    position: "relative",
    marginRight: 12,
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
        <PostsItemTooltip post={post} showAllinfo wide truncateLimit={900} hideOnMedium={false}/>
      </LWPopper>
      {linkElement}
    </span>
  );
}
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, withHover, withStyles(styles, {name:"PostLinkPreviewWithPost"}));

const CommentLinkPreviewWithComment = ({classes, href, innerHTML, comment, post, anchorEl, hover}) => {
  const { CommentsNode, LWPopper } = Components
  const linkElement = <span className={classes.linkElement}>
      <Link className={classes.link} to={href}>
        <span dangerouslySetInnerHTML={{__html: innerHTML}}></span>{" "}<span className={classes.indicator}>LW</span>
      </Link>
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
        <Card style={{maxWidth:600}}>
          <CommentsNode
            truncated
            comment={comment}
            post={post}
            showPostTitle
            hoverPreview
            forceNotSingleLine
          />
        </Card>
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
