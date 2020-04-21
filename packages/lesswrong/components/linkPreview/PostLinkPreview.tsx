import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments';
import { Link } from '../../lib/reactRouterWrapper';
import { usePostBySlug, usePostByLegacyId } from '../posts/usePost';
import { useCommentByLegacyId } from '../comments/useComment';
import { useHover } from '../common/withHover';
import { useQuery } from 'react-apollo';
import Card from '@material-ui/core/Card';
import { looksLikeDbIdString } from '../../lib/routeUtil';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import gql from 'graphql-tag';
import { postHighlightStyles } from '../../themes/stylePiping';

const PostLinkPreview = ({href, targetLocation, innerHTML, id}: {
  href: string,
  targetLocation: any,
  innerHTML: string,
  id: string,
}) => {
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

const PostLinkPreviewSequencePost = ({href, targetLocation, innerHTML, id}: {
  href: string,
  targetLocation: any,
  innerHTML: string,
  id: string,
}) => {
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

const PostLinkPreviewSlug = ({href, targetLocation, innerHTML, id}: {
  href: string,
  targetLocation: any,
  innerHTML: string,
  id: string,
}) => {
  const slug = targetLocation.params.slug;
  const { post, error } = usePostBySlug({ slug });

  return <Components.PostLinkPreviewVariantCheck href={href} innerHTML={innerHTML} post={post} targetLocation={targetLocation} error={error} id={id} />
}
const PostLinkPreviewSlugComponent = registerComponent('PostLinkPreviewSlug', PostLinkPreviewSlug);

const PostLinkPreviewLegacy = ({href, targetLocation, innerHTML, id}: {
  href: string,
  targetLocation: any,
  innerHTML: string,
  id: string,
}) => {
  const legacyId = targetLocation.params.id;
  const { post, error } = usePostByLegacyId({ legacyId });

  return <Components.PostLinkPreviewVariantCheck href={href} innerHTML={innerHTML} post={post} targetLocation={targetLocation} error={error} id={id} />
}
const PostLinkPreviewLegacyComponent = registerComponent('PostLinkPreviewLegacy', PostLinkPreviewLegacy);

const CommentLinkPreviewLegacy = ({href, targetLocation, innerHTML, id}: {
  href: string,
  targetLocation: any,
  innerHTML: string,
  id: string,
}) => {
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

const PostCommentLinkPreviewGreaterWrong = ({href, targetLocation, innerHTML, id}: {
  href: string,
  targetLocation: any,
  innerHTML: string,
  id: string,
}) => {
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
  post: PostsList|null,
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

export const linkStyle = theme => ({
  position: "relative",
  marginRight: 6,
  '&:after': {
    content: '"°"',
    marginLeft: 1,
    marginRight: 1,
    color: theme.palette.primary.main,
    position: "absolute"
  }
})

const styles = theme => ({
  link: {
    ...linkStyle(theme)
  }
})

const PostLinkCommentPreview = ({href, commentId, post, innerHTML, id}: {
  href: string,
  commentId: string,
  post: PostsList|null,
  innerHTML: string,
  id: string,
}) => {

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

const PostLinkPreviewWithPost = ({classes, href, innerHTML, post, id, error}: {
  classes: ClassesType,
  href: string,
  innerHTML: string,
  post: PostsList|null,
  id: string,
  error: any,
}) => {
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
        <PostsPreviewTooltip post={post} />
      </LWPopper>
      <Link className={classes.link} to={href} dangerouslySetInnerHTML={{__html: innerHTML}} id={id} smooth/>
    </span>
  );
}
const PostLinkPreviewWithPostComponent = registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, {
  styles
});

const CommentLinkPreviewWithComment = ({classes, href, innerHTML, comment, post, id, error}: {
  classes: ClassesType,
  href: string,
  innerHTML: string,
  comment: any,
  post: PostsList|null,
  id: string,
  error: any,
}) => {
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
        <PostsPreviewTooltip post={post} comment={comment} />
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
  classes: ClassesType,
  href: string,
  innerHTML: string,
  onsite?: boolean,
  id?: string,
}) => {
  const { LWPopper } = Components
  const { eventHandlers, hover, anchorEl, stopHover } = useHover({
    pageElementContext: "linkPreview",
    hoverPreviewType: "DefaultPreview",
    href,
    onsite
  });
  return (
    <span {...eventHandlers}>
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start" onMouseEnter={stopHover}>
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

const mozillaHubStyles = (theme) => ({
  users: {
    marginLeft: 3,
    fontSize: "1.2rem",
    fontWeight: 600
  },
  usersPreview: {
    fontSize: "1.1rem"
  },
  icon: {
    height: 18,
    position: "relative",
    top: 3
  },
  image: {
    width: 350,
    height: 200
  },
  roomInfo: {
    ...postHighlightStyles(theme),
    padding: 16
  },
  roomHover: {
    position: "relative",
  },
  roomTitle: {
    fontWeight: 600,
    fontSize: "1.3rem"
  },
  card: {
    boxShadow: "0px 0px 10px rgba(0,0,0,.1)",
    width: 350,
    backgroundColor: "white"
  },
  description: {
    marginTop: 8,
    fontSize: "1.1rem"
  }
})

const MozillaHubPreview = ({classes, href, innerHTML, id}: {
  classes: ClassesType,
  href: string,
  innerHTML: string,
  id?: string,
}) => {
  const roomId = href.split("/")[3]
  const { data: rawData, loading } = useQuery(gql`
    query MozillaHubsRoomData {
      MozillaHubsRoomData(roomId: "${roomId || 'asdasd'}") {
        id
        previewImage
        lobbyCount
        memberCount
        roomSize
        description
        url
        name
      }
    }
  `, {
    ssr: true
  });
  
  const data = rawData?.MozillaHubsRoomData
  const { AnalyticsTracker } = Components
  const { LWPopper } = Components
  const { anchorEl, hover, eventHandlers } = useHover();
  if (loading || !data) return <a href={href}>
    <span dangerouslySetInnerHTML={{__html: innerHTML}}/>
  </a>  

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <span {...eventHandlers}>
      <a href={data.url} id={id}>
        <span dangerouslySetInnerHTML={{__html: innerHTML}}/>
        <span className={classes.users}>
          (<SupervisorAccountIcon className={classes.icon}/> 
          {data.memberCount}/{data.roomSize})
        </span>
      </a>
      
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
        <div className={classes.card}>
          <img className={classes.image} src={data.previewImage}/>
          <div className={classes.roomInfo}>
            <div className={classes.roomTitle}>{data.name}</div>
            <div className={classes.usersPreview}>
              <SupervisorAccountIcon className={classes.icon}/> 
              {data.memberCount}/{data.roomSize} users online ({data.lobbyCount} in lobby)
            </div>
            {data.description && <div className={classes.description}>
              {data.description}
            </div>}
          </div>
        </div>
      </LWPopper>
    </span>
  </AnalyticsTracker>
}

const MozillaHubPreviewComponent = registerComponent('MozillaHubPreview', MozillaHubPreview, {
  styles: mozillaHubStyles
})

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
    MozillaHubPreview: typeof MozillaHubPreviewComponent,
    DefaultPreview: typeof DefaultPreviewComponent,
  }
}
