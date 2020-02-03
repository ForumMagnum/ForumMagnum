import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments';
import { Link } from '../../lib/reactRouterWrapper';
import { usePostBySlug, usePostByLegacyId } from '../posts/usePost';
import { useCommentByLegacyId } from '../comments/useComment';
import { useHover } from '../common/withHover';
import Card from '@material-ui/core/Card';
import { looksLikeDbIdString } from '../../lib/routeUtil';

const PostLinkPreview = ({href, targetLocation, innerHTML, id}) => {
  const postID = targetLocation.params._id;

  const { document: post, error } = useSingle({
    collection: Posts,
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO

    documentId: postID,
  });

  return <Components.PostLinkPreviewVariantCheck post={post} targetLocation={targetLocation} error={error} href={href} innerHTML={innerHTML} id={id} />
}
const PostLinkPreviewComponent = registerComponent('PostLinkPreview', PostLinkPreview);

const PostLinkPreviewSequencePost = ({href, targetLocation, innerHTML, id}) => {
  const postID = targetLocation.params.postId;

  const { document: post, error } = useSingle({
    collection: Posts,
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: postID,
  });

  return <Components.PostLinkPreviewVariantCheck post={post} targetLocation={targetLocation} error={error} href={href} innerHTML={innerHTML} id={id} />
}
const PostLinkPreviewSequencePostComponent = registerComponent('PostLinkPreviewSequencePost', PostLinkPreviewSequencePost);

const PostLinkPreviewSlug = ({href, targetLocation, innerHTML, id}) => {
  const slug = targetLocation.params.slug;
  const { post, error } = usePostBySlug({ slug });

  return <Components.PostLinkPreviewVariantCheck href={href} innerHTML={innerHTML} post={post} targetLocation={targetLocation} error={error} id={id} />
}
const PostLinkPreviewSlugComponent = registerComponent('PostLinkPreviewSlug', PostLinkPreviewSlug);

const PostLinkPreviewLegacy = ({href, targetLocation, innerHTML, id}) => {
  const legacyId = targetLocation.params.id;
  const { post, error } = usePostByLegacyId({ legacyId });

  return <Components.PostLinkPreviewVariantCheck href={href} innerHTML={innerHTML} post={post} targetLocation={targetLocation} error={error} id={id} />
}
const PostLinkPreviewLegacyComponent = registerComponent('PostLinkPreviewLegacy', PostLinkPreviewLegacy);

const CommentLinkPreviewLegacy = ({href, targetLocation, innerHTML, id}) => {
  const legacyPostId = targetLocation.params.id;
  const legacyCommentId = targetLocation.params.commentId;

  const { post, loading: loadingPost, error: postError } = usePostByLegacyId({ legacyId: legacyPostId });
  const { comment, loading: loadingComment, error: commentError } = useCommentByLegacyId({ legacyId: legacyCommentId });
  const error = postError || commentError;
  const loading = loadingPost || loadingComment;

  if (comment) {
    return <Components.CommentLinkPreviewWithComment comment={comment} post={post} error={error} href={href} innerHTML={innerHTML} id={id} />
  }
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} id={id} />
}
const CommentLinkPreviewLegacyComponent = registerComponent('CommentLinkPreviewLegacy', CommentLinkPreviewLegacy);

const PostCommentLinkPreviewGreaterWrong = ({href, targetLocation, innerHTML, id}) => {
  const postId = targetLocation.params._id;
  const commentId = targetLocation.params.commentId;

  const { document: post } = useSingle({
    collection: Posts,
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO

    documentId: postId,
  });

  return <Components.PostLinkCommentPreview href={href} innerHTML={innerHTML} commentId={commentId} post={post} id={id}/>
}
const PostCommentLinkPreviewGreaterWrongComponent = registerComponent('PostCommentLinkPreviewGreaterWrong', PostCommentLinkPreviewGreaterWrong);

const PostLinkPreviewVariantCheck = ({ href, innerHTML, post, targetLocation, comment, commentId, error, id}: {
  href: string,
  innerHTML: string,
  post: any,
  targetLocation: any,
  comment?: any,
  commentId?: string,
  error: any,
  id: string,
}) => {
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
    return <Components.PostLinkCommentPreview commentId={commentId} post={post} href={href} innerHTML={innerHTML} id={id}/>
  }

  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} id={id} />
}
const PostLinkPreviewVariantCheckComponent = registerComponent('PostLinkPreviewVariantCheck', PostLinkPreviewVariantCheck);


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
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: commentId,
  });

  if (comment) {
    return <Components.CommentLinkPreviewWithComment comment={comment} post={post} error={error} href={href} innerHTML={innerHTML} id={id}/>
  }
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} id={id} />

}
const PostLinkCommentPreviewComponent = registerComponent('PostLinkCommentPreview', PostLinkCommentPreview);

const PostLinkPreviewWithPost = ({classes, href, innerHTML, post, id, error}) => {
  const { PostsPreviewTooltip, LWPopper } = Components
  const { anchorEl, hover, eventHandlers } = useHover();

  if (!post) {
    return <span {...eventHandlers}>
      <Link to={href}  dangerouslySetInnerHTML={{__html: innerHTML}}/>;
    </span>
  }
  return (
    <span {...eventHandlers}>
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
        <PostsPreviewTooltip post={post} showAllInfo truncateLimit={900}/>
      </LWPopper>
      <Link className={classes.link} to={href}  dangerouslySetInnerHTML={{__html: innerHTML}} id={id}/>
    </span>
  );
}
const PostLinkPreviewWithPostComponent = registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, {
  styles
});

const CommentLinkPreviewWithComment = ({classes, href, innerHTML, comment, post, id, error}) => {
  const { PostsPreviewTooltip, LWPopper } = Components
  const { eventHandlers, anchorEl, hover } = useHover();

  if (!comment) {
    return <span {...eventHandlers}>
      <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}}/>
    </span>;
  }
  return (
    <span {...eventHandlers}>
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
        <PostsPreviewTooltip post={post} comment={comment} showAllInfo truncateLimit={900}/>
      </LWPopper>
      <Link className={classes.link} to={href} dangerouslySetInnerHTML={{__html: innerHTML}} id={id}/>
    </span>
  );
}
const CommentLinkPreviewWithCommentComponent = registerComponent('CommentLinkPreviewWithComment', CommentLinkPreviewWithComment, {
  styles,
});

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

const DefaultPreview = ({classes, href, innerHTML, onsite=false, id}: {
  classes: any,
  href: string,
  innerHTML: string,
  onsite?: boolean,
  id?: string,
}) => {
  const { LWPopper } = Components
  const { eventHandlers, hover, anchorEl } = useHover({
    pageElementContext: "linkPreview",
    hoverPreviewType: "DefaultPreview",
    href,
    onsite,
  });
  return (
    <span {...eventHandlers}>
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
const DefaultPreviewComponent = registerComponent('DefaultPreview', DefaultPreview, {
  styles: defaultPreviewStyles,
});

declare global {
  interface ComponentTypes {
    PostLinkPreview: typeof PostLinkPreviewComponent,
    PostLinkPreviewSequencePost: typeof PostLinkPreviewSequencePostComponent,
    PostLinkPreviewSlug: typeof PostLinkPreviewSlugComponent,
    PostLinkPreviewLegacy: typeof PostLinkPreviewLegacyComponent,
    CommentLinkPreviewLegacy: typeof CommentLinkPreviewLegacyComponent,
    PostCommentLinkPreviewGreaterWrong: typeof PostCommentLinkPreviewGreaterWrongComponent,
    PostLinkPreviewVariantCheck: typeof PostLinkPreviewVariantCheckComponent,
    PostLinkCommentPreview: typeof PostLinkCommentPreviewComponent,
    PostLinkPreviewWithPost: typeof PostLinkPreviewWithPostComponent,
    CommentLinkPreviewWithComment: typeof CommentLinkPreviewWithCommentComponent,
    DefaultPreview: typeof DefaultPreviewComponent,
  }
}
