import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useSingle } from '../../lib/crud/withSingle';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments';
import { Link } from '../../lib/reactRouterWrapper';
import { usePostBySlug, usePostByLegacyId } from '../posts/usePost';
import { useCommentByLegacyId } from '../comments/useComment';
import withHover from '../common/withHover';
import Card from '@material-ui/core/Card';
import { withStyles } from '@material-ui/core/styles';
import { looksLikeDbIdString } from '../../lib/routeUtil';

const PostLinkPreview = ({href, targetLocation, innerHTML, id}) => {
  const postID = targetLocation.params._id;

  const { document: post, error } = useSingle({
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',

    documentId: postID,
  });

  return <Components.PostLinkPreviewVariantCheck post={post} targetLocation={targetLocation} error={error} href={href} innerHTML={innerHTML} id={id} />
}
registerComponent('PostLinkPreview', PostLinkPreview);

const PostLinkPreviewSequencePost = ({href, targetLocation, innerHTML, id}) => {
  const postID = targetLocation.params.postId;

  const { document: post, error } = useSingle({
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',
    documentId: postID,
  });

  return <Components.PostLinkPreviewVariantCheck post={post} targetLocation={targetLocation} error={error} href={href} innerHTML={innerHTML} id={id} />
}
registerComponent('PostLinkPreviewSequencePost', PostLinkPreviewSequencePost);

const PostLinkPreviewSlug = ({href, targetLocation, innerHTML, id}) => {
  const slug = targetLocation.params.slug;
  const { post, error } = usePostBySlug({ slug });

  return <Components.PostLinkPreviewVariantCheck href={href} innerHTML={innerHTML} post={post} targetLocation={targetLocation} error={error} id={id} />
}
registerComponent('PostLinkPreviewSlug', PostLinkPreviewSlug);

const PostLinkPreviewLegacy = ({href, targetLocation, innerHTML, id={id}}) => {
  const legacyId = targetLocation.params.id;
  const { post, error } = usePostByLegacyId({ legacyId });

  return <Components.PostLinkPreviewVariantCheck href={href} innerHTML={innerHTML} post={post} targetLocation={targetLocation} error={error} id={id} />
}
registerComponent('PostLinkPreviewLegacy', PostLinkPreviewLegacy);

const CommentLinkPreviewLegacy = ({href, targetLocation, innerHTML, id}) => {
  const legacyPostId = targetLocation.params.id;
  const legacyCommentId = targetLocation.params.commentId;

  const { post, loading: loadingPost, error: postError } = usePostByLegacyId({ legacyId: legacyPostId });
  const { comment, loading: loadingComment, error: commentError } = useCommentByLegacyId({ legacyId: legacyCommentId });
  const error = postError || commentError;
  const loading = loadingPost || loadingComment;

  if (comment) {
    return <Components.CommentLinkPreviewWithComment comment={comment} post={post} loading={loading} error={error} href={href} innerHTML={innerHTML} id={id} />
  }
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} loading={loading} error={error} id={id} />
}
registerComponent('CommentLinkPreviewLegacy', CommentLinkPreviewLegacy);

const PostCommentLinkPreviewGreaterWrong = ({href, targetLocation, innerHTML, id}) => {
  const postId = targetLocation.params._id;
  const commentId = targetLocation.params.commentId;

  const { document: post } = useSingle({
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',

    documentId: postId,
  });

  return <Components.PostLinkCommentPreview href={href} innerHTML={innerHTML} commentId={commentId} post={post} id={id}/>
}
registerComponent('PostCommentLinkPreviewGreaterWrong', PostCommentLinkPreviewGreaterWrong);

const PostLinkPreviewVariantCheck = ({ href, innerHTML, post, targetLocation, comment, commentId, error, id}) => {
  if (targetLocation.query.commentId) {
    return <PostLinkCommentPreview commentId={targetLocation.query.commentId} href={href} innerHTML={innerHTML} post={post} id={id}/>
  }
  if (targetLocation.hash) {
    const commentId = targetLocation.hash.split("#")[1]
    if (looksLikeDbIdString(commentId)) {
      return <PostLinkCommentPreview commentId={commentId} href={href} innerHTML={innerHTML} post={post} id={id} />
    }
  }

  if (commentId) {
    return <Components.PostLinkCommentPreview commentId={commentId} href={href} innerHTML={innerHTML} id={id}/>
  }

  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} id={id} />
}
registerComponent('PostLinkPreviewVariantCheck', PostLinkPreviewVariantCheck);


const styles = theme => ({
  link: {
    position: "relative",
    marginRight: 6,
    '&:after': {
      content: '"°"',
      marginLeft: 1,
      marginRight: 1,
      color: theme.palette.primary.main,
      position: "absolute"
    }
  }
})

const PostLinkCommentPreview = ({href, commentId, post, innerHTML, id}) => {

  const { document: comment, error } = useSingle({
    collection: Comments,
    queryName: "commentLinkPreview",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-then-network',
    documentId: commentId,
  });

  if (comment) {
    return <Components.CommentLinkPreviewWithComment comment={comment} post={post} error={error} href={href} innerHTML={innerHTML} id={id}/>
  }
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} id={id} />

}
registerComponent('PostLinkCommentPreview', PostLinkCommentPreview);

const PostLinkPreviewWithPost = ({classes, href, innerHTML, post, anchorEl, hover, id}) => {
  const { PostsPreviewTooltip, LWPopper } = Components

  if (!post) {
    return <Link to={href}  dangerouslySetInnerHTML={{__html: innerHTML}}/>;
  }
  return (
    <span>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={{
          flip: {
            behavior: ["bottom-start", "top-end", "bottom-start"],
            boundariesElement: 'viewport'
          }
        }}
      >
        <PostsPreviewTooltip post={post} showAllInfo />
      </LWPopper>
      <Link className={classes.link} to={href}  dangerouslySetInnerHTML={{__html: innerHTML}} id={id}/>
    </span>
  );
}
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, withHover(), withStyles(styles, {name:"PostLinkPreviewWithPost"}));

const CommentLinkPreviewWithComment = ({classes, href, innerHTML, comment, post, anchorEl, hover, id}) => {
  const { PostsPreviewTooltip, LWPopper } = Components

  if (!comment) {
    return <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}}/>
    ;
  }
  return (
    <span>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={{
          flip: {
            behavior: ["bottom-start", "top-end", "bottom-start"],
            boundariesElement: 'viewport'
          }
        }}
      >
        <PostsPreviewTooltip post={post} comment={comment} showAllInfo wide />
      </LWPopper>
      <Link className={classes.link} to={href} dangerouslySetInnerHTML={{__html: innerHTML}} id={id}/>
    </span>
  );
}
registerComponent('CommentLinkPreviewWithComment', CommentLinkPreviewWithComment, withHover(), withStyles(styles, {name:"CommentLinkPreviewWithComment"}));

const defaultPreviewStyles = theme => ({
  hovercard: {
    padding: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    ...theme.typography.body2,
    fontSize: "1.1rem",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    maxWidth: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
})

const DefaultPreview = ({classes, href, innerHTML, anchorEl, hover, onsite=false, id}) => {
  const { LWPopper } = Components
  return (
    <span>
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
        <Card>
          <div className={classes.hovercard}>
            {href}
          </div>
        </Card>
      </LWPopper>

      {onsite
        ? <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}} id={id}/>
        : <Components.AnalyticsTracker eventType="link" eventProps={{to: href}}>
            <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} id={id}/>
          </Components.AnalyticsTracker>}
    </span>
  );
}
registerComponent('DefaultPreview',
  DefaultPreview,
  withHover({pageElementContext: "linkPreview", hoverPreviewType: "DefaultPreview"},
    ({href, onsite})=>({href, onsite})),
  withStyles(defaultPreviewStyles, {name:"DefaultPreview"}));
