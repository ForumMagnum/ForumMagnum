import { gql, useQuery } from '@apollo/client';
import Card from '@material-ui/core/Card';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from '../../lib/reactRouterWrapper';
import { looksLikeDbIdString } from '../../lib/routeUtil';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCommentByLegacyId } from '../comments/useComment';
import { useHover } from '../common/withHover';
import { usePostByLegacyId, usePostBySlug } from '../posts/usePost';
import { isClient } from '../../lib/executionEnvironment';

let missingLinkPreviewsLogged = new Set<string>();

// Log a message about a link-preview being a broken link. Suppresses duplicate
// logs. Client-side only (so the set of saved messages can't grow huge, as it
// would on a server).
//
// This is special-cased error handling because in the LessWrong dev DB, it's
// fairly common to load the front page and find that it has RSS-synced posts
// on it which contain links to LessWrong posts that only exist in the prod DB,
// not the dev DB, and the error-logging that used to produce was extremely
// voluminous.
function logMissingLinkPreview(message: string)
{
  if (isClient) {
    if(!missingLinkPreviewsLogged.has(message)) {
      missingLinkPreviewsLogged.add(message);
      //eslint-disable-next-line no-console
      console.log(message);
    }
  }
}

const PostLinkPreview = ({href, targetLocation, innerHTML, id}: {
  href: string,
  targetLocation: any,
  innerHTML: string,
  id: string,
}) => {
  const postID = targetLocation.params._id;

  const { document: post, loading, error } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO

    documentId: postID,
    allowNull: true,
  });
  
  if (!loading && !post) {
    logMissingLinkPreview(`Link preview: No post found with ID ${postID}`);
  }

  return <Components.PostLinkPreviewVariantCheck
    post={post||null}
    targetLocation={targetLocation}
    error={error}
    href={href} innerHTML={innerHTML} id={id}
  />
}
const PostLinkPreviewComponent = registerComponent('PostLinkPreview', PostLinkPreview);

const PostLinkPreviewSequencePost = ({href, targetLocation, innerHTML, id}: {
  href: string,
  targetLocation: any,
  innerHTML: string,
  id: string,
}) => {
  const postID = targetLocation.params.postId;

  const { document: post, loading, error } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: postID,
    allowNull: true,
  });

  if (!loading && !post) {
    logMissingLinkPreview(`Link preview: No post found with ID ${postID}`);
  }

  return <Components.PostLinkPreviewVariantCheck post={post||null} targetLocation={targetLocation} error={error} href={href} innerHTML={innerHTML} id={id} />
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

  const { post, error: postError } = usePostByLegacyId({ legacyId: legacyPostId });
  const { comment, error: commentError } = useCommentByLegacyId({ legacyId: legacyCommentId });
  const error = postError || commentError;

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

  const { document: post, loading } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO

    documentId: postId,
    allowNull: true,
  });

  if (!loading && !post) {
    logMissingLinkPreview(`Link preview: No post found with ID ${postId}`);
  }
  return <Components.PostLinkCommentPreview href={href} innerHTML={innerHTML} commentId={commentId} post={post||null} id={id}/>
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

export const linkStyle = (theme: ThemeType) => ({
  '&:after': {
    content: '"°"',
    marginLeft: 1,
    color: theme.palette.primary.main,
  }
})

const styles = (theme: ThemeType): JssStyles => ({
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

  const { document: comment, loading, error } = useSingle({
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: commentId,
    allowNull: true,
  });

  if (!loading && !comment) {
    logMissingLinkPreview(`Link preview: No comment found with ID ${commentId}`);
  }
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
  
  const hash = (href.indexOf("#")>=0) ? (href.split("#")[1]) : null;

  if (!post) {
    return <span {...eventHandlers}>
      <Link to={href}  dangerouslySetInnerHTML={{__html: innerHTML}}/>
    </span>
  }
  return (
    <span {...eventHandlers}>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
        allowOverflow
      >
        <PostsPreviewTooltip post={post} hash={hash} />
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
    </span>
  }
  return (
    <span {...eventHandlers}>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
        allowOverflow
      >
        <PostsPreviewTooltip post={post} comment={comment} />
      </LWPopper>
      <Link className={classes.link} to={href} dangerouslySetInnerHTML={{__html: innerHTML}} id={id}/>
    </span>
  )
}
const CommentLinkPreviewWithCommentComponent = registerComponent('CommentLinkPreviewWithComment', CommentLinkPreviewWithComment, {
  styles,
});

const SequencePreview = ({classes, targetLocation, href, innerHTML}: {
  classes: ClassesType,
  targetLocation: any,
  href: string,
  innerHTML: string
}) => {
  const { LWPopper, SequencesHoverOver } = Components
  const sequenceId = targetLocation.params._id;
  const { eventHandlers, anchorEl, hover } = useHover();

  const { document: sequence, loading } = useSingle({
    documentId: sequenceId,
    collectionName: "Sequences",
    fragmentName: 'SequencesPageFragment',
    fetchPolicy: 'cache-then-network' as any,
    allowNull: true,
  });
  
  if (!sequence && !loading) {
    logMissingLinkPreview(`Link preview: No sequence  found with ID ${sequenceId}`);
  }

  return (
    <span {...eventHandlers}>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
        allowOverflow
      >
        <SequencesHoverOver sequence={sequence || null} />
      </LWPopper>
      <Link className={classes.link} to={href} dangerouslySetInnerHTML={{__html: innerHTML}} id={sequenceId}/>
    </span>
  )
}

const SequencePreviewComponent = registerComponent('SequencePreview', SequencePreview, {
  styles,
});

const defaultPreviewStyles = (theme: ThemeType): JssStyles => ({
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

const DefaultPreview = ({classes, href, innerHTML, onsite=false, id, rel}: {
  classes: ClassesType,
  href: string,
  innerHTML: string,
  onsite?: boolean,
  id?: string,
  rel?: string
}) => {
  const { LWPopper } = Components
  const { eventHandlers, hover, anchorEl } = useHover({
    pageElementContext: "linkPreview",
    hoverPreviewType: "DefaultPreview",
    href,
    onsite
  });
  return (
    <span {...eventHandlers}>
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start" clickable={false}>
        <Card>
          <div className={classes.hovercard}>
            {href}
          </div>
        </Card>
      </LWPopper>

      {onsite
        ? <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}} id={id} rel={rel}/>
        : <Components.AnalyticsTracker eventType="link" eventProps={{to: href}}>
            <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} id={id} rel={rel}/>
          </Components.AnalyticsTracker>}
    </span>
  );
}
const DefaultPreviewComponent = registerComponent('DefaultPreview', DefaultPreview, {
  styles: defaultPreviewStyles,
});

const mozillaHubStyles = (theme: ThemeType): JssStyles => ({
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
    boxShadow: theme.palette.boxShadow.mozillaHubPreview,
    width: 350,
    backgroundColor: theme.palette.panelBackground.default,
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
  const { AnalyticsTracker, LWPopper, ContentStyles } = Components
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
          <ContentStyles contentType="postHighlight" className={classes.roomInfo}>
            <div className={classes.roomTitle}>{data.name}</div>
            <div className={classes.usersPreview}>
              <SupervisorAccountIcon className={classes.icon}/> 
              {data.memberCount}/{data.roomSize} users online ({data.lobbyCount} in lobby)
            </div>
            {data.description && <div className={classes.description}>
              {data.description}
            </div>}
          </ContentStyles>
        </div>
      </LWPopper>
    </span>
  </AnalyticsTracker>
}

const MozillaHubPreviewComponent = registerComponent('MozillaHubPreview', MozillaHubPreview, {
  styles: mozillaHubStyles
})

const owidStyles = (theme: ThemeType): JssStyles => ({
  iframeStyling: {
    width: 600,
    height: 375,
    border: "none",
    maxWidth: "100vw",
  },
  link: {
    ...linkStyle(theme)
  }
})

const OWIDPreview = ({classes, href, innerHTML, id}: {
  classes: ClassesType,
  href: string,
  innerHTML: string,
  id?: string,
}) => {
  const { AnalyticsTracker, LWPopper } = Components
  const { anchorEl, hover, eventHandlers } = useHover();
  const [match] = href.match(/^http(?:s?):\/\/ourworldindata\.org\/grapher\/.*/) || []

  if (!match) {
    return <a href={href}>
      <span dangerouslySetInnerHTML={{__html: innerHTML}}/>
    </a>
  }

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <span {...eventHandlers}>
      <a className={classes.link} href={href} id={id} dangerouslySetInnerHTML={{__html: innerHTML}} />
      
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
        <div className={classes.background}>
          <iframe className={classes.iframeStyling} src={match} />
        </div>
      </LWPopper>
    </span>
  </AnalyticsTracker>
}

const OWIDPreviewComponent = registerComponent('OWIDPreview', OWIDPreview, {
  styles: owidStyles
})

const metaculusStyles = (theme: ThemeType): JssStyles => ({
  background: {
    backgroundColor: theme.palette.panelBackground.metaculusBackground,
  },
  iframeStyling: {
    width: 400,
    height: 250, 
    border: "none",
    maxWidth: "100vw"
  },
  link: {
    ...linkStyle(theme)
  }
})

const MetaculusPreview = ({classes, href, innerHTML, id}: {
  classes: ClassesType,
  href: string,
  innerHTML: string,
  id?: string,
}) => {
  const { AnalyticsTracker, LWPopper } = Components
  const { anchorEl, hover, eventHandlers } = useHover();
  const [match, www, questionNumber] = href.match(/^http(?:s?):\/\/(www\.)?metaculus\.com\/questions\/([a-zA-Z0-9]{1,6})?/) || []

  if (!questionNumber) {
    return <a href={href}>
      <span dangerouslySetInnerHTML={{__html: innerHTML}}/>
    </a>  
  }

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <span {...eventHandlers}>
      <a className={classes.link} href={href} id={id} dangerouslySetInnerHTML={{__html: innerHTML}} />
      
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
        <div className={classes.background}>
          <iframe className={classes.iframeStyling} src={`https://d3s0w6fek99l5b.cloudfront.net/s/1/questions/embed/${questionNumber}/?plot=pdf`} />
        </div>
      </LWPopper>
    </span>
  </AnalyticsTracker>
}

const MetaculusPreviewComponent = registerComponent('MetaculusPreview', MetaculusPreview, {
  styles: metaculusStyles
})

const manifoldStyles = (theme: ThemeType): JssStyles => ({
  iframeStyling: {
    width: 560,
    height: 405,
    border: "none",
    maxWidth: "100vw",
  },
  link: linkStyle(theme),
});

const ManifoldPreview = ({classes, href, innerHTML, id}: {
  classes: ClassesType;
  href: string;
  innerHTML: string;
  id?: string;
}) => {
  const { AnalyticsTracker, LWPopper } = Components;
  const { anchorEl, hover, eventHandlers } = useHover();

  // test if fits https://manifold.markets/embed/[...]
  const isEmbed = /^https?:\/\/manifold\.markets\/embed\/.+$/.test(href);

  // if it fits  https://manifold.markets/[username]/[market-slug] instead, get the (username and market slug)
  const [, userAndSlug] = href.match(/^https?:\/\/manifold\.markets\/(\w+\/[\w-]+)/) || [];

  if (!isEmbed && !userAndSlug) {
    return (
      <a href={href}>
        <span dangerouslySetInnerHTML={{ __html: innerHTML }} />
      </a>
    );
  }

  const url = isEmbed ? href : `https://manifold.markets/embed/${userAndSlug}`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classes.link} href={href} id={id} dangerouslySetInnerHTML={{ __html: innerHTML }} />

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.iframeStyling} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

const ManifoldPreviewComponent = registerComponent('ManifoldPreview', ManifoldPreview, { styles: manifoldStyles })

const metaforecastStyles = (theme: ThemeType): JssStyles => ({
  iframeStyling: {
    width: 560,
    height: 405,
    border: "none",
    maxWidth: "100vw",
  },
  link: linkStyle(theme),
});

const MetaforecastPreview = ({classes, href, innerHTML, id}: {
  classes: ClassesType;
  href: string;
  innerHTML: string;
  id?: string;
}) => {
  const { AnalyticsTracker, LWPopper } = Components;
  const { anchorEl, hover, eventHandlers } = useHover();

  // test if fits https://metaforecast.org/questions/embed/[...]
  const isEmbed = /^https?:\/\/metaforecast\.org\/questions\/embed\/.+$/.test(href);

  // test if it fits https://manifold.markets/questions/[...] instead
  const [, questionId] = href.match(/^https?:\/\/metaforecast\.org\/questions\/([\w-]+)/) || [];

  if (!isEmbed && !questionId) {
    return (
      <a href={href}>
        <span dangerouslySetInnerHTML={{ __html: innerHTML }} />
      </a>
    );
  }

  const url = isEmbed ? href : `https://metaforecast.org/questions/embed/${questionId}`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classes.link} href={href} id={id} dangerouslySetInnerHTML={{ __html: innerHTML }} />

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.iframeStyling} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

const MetaforecastPreviewComponent = registerComponent('MetaforecastPreview', MetaforecastPreview, { styles: metaforecastStyles })

const ArbitalLogo = () => <svg x="0px" y="0px" height="100%" viewBox="0 0 27.5 23.333">
  <g>
    <path d="M19.166,20.979v-0.772c-1.035,0.404-2.159,0.626-3.334,0.626c-0.789,0-1.559-0.1-2.291-0.288
      c-0.813-0.21-1.584-0.529-2.292-0.94c-0.032-0.019-0.06-0.042-0.091-0.061c-2.686-1.596-4.49-4.525-4.492-7.877
      c0.001-3.027,1.471-5.713,3.733-7.381c-0.229,0.04-0.458,0.079-0.679,0.139C9.68,4.435,9.643,4.449,9.604,4.461
      C9.359,4.53,9.123,4.613,8.891,4.706c-0.07,0.028-0.14,0.057-0.209,0.086C8.42,4.906,8.164,5.029,7.918,5.172
      c-2.243,1.299-3.752,3.717-3.752,6.494c0,2.99,1.123,5.711,2.973,7.777c0.285,0.319,0.594,0.625,0.918,0.915
      c1.123,1.005,2.44,1.797,3.888,2.309c0.626,0.223,1.272,0.39,1.944,0.503c0.632,0.105,1.281,0.162,1.943,0.162
      c1.159,0,2.277-0.17,3.334-0.484V20.979z"></path>
    <path d="M19.443,2.975c-1.123-1.007-2.441-1.799-3.889-2.311c-0.623-0.221-1.273-0.391-1.943-0.502
      C12.979,0.056,12.33,0,11.666,0c-1.365,0-2.671,0.233-3.889,0.664C6.33,1.176,5.012,1.966,3.889,2.971
      C1.5,5.11,0.001,8.208,0,11.666c0.001,3.457,1.5,6.557,3.889,8.695c1.123,1.004,2.441,1.794,3.889,2.306
      c0.32,0.113,0.646,0.213,0.979,0.298c-0.186-0.116-0.361-0.248-0.541-0.373c-0.108-0.075-0.219-0.146-0.324-0.224
      c-0.327-0.243-0.645-0.498-0.947-0.77c-0.363-0.327-0.715-0.674-1.047-1.044C3.785,18.198,2.5,15.078,2.5,11.666
      c0-3.393,1.846-6.355,4.582-7.937c1.35-0.78,2.916-1.231,4.584-1.231c0.789,0,1.559,0.102,2.292,0.291
      c0.813,0.209,1.584,0.529,2.292,0.938c2.738,1.583,4.582,4.546,4.584,7.938c-0.002,3.027-1.473,5.713-3.736,7.381
      c-0.007,0.005-0.013,0.011-0.02,0.016c0.237-0.039,0.471-0.092,0.699-0.154c0.042-0.011,0.082-0.026,0.124-0.038
      c0.24-0.069,0.475-0.151,0.704-0.242c0.072-0.029,0.144-0.058,0.215-0.089c0.261-0.113,0.517-0.236,0.761-0.378l1.251-0.725v2.562
      v0.98v2.354h2.5v-2.351v-0.984v-8.332c0-2.992-1.123-5.712-2.971-7.777C20.074,3.568,19.767,3.265,19.443,2.975z"></path>
    <path d="M23.609,2.971c-1.123-1.005-2.44-1.795-3.888-2.307C19.4,0.551,19.073,0.451,18.74,0.365
      c0.186,0.116,0.36,0.246,0.539,0.371c0.109,0.076,0.223,0.148,0.33,0.228c0.326,0.243,0.643,0.497,0.945,0.769
      c0.365,0.327,0.716,0.674,1.049,1.043c2.109,2.357,3.396,5.479,3.396,8.891v8.332v0.984v2.35H27.5V11.666
      C27.498,8.208,25.999,5.11,23.609,2.971z"></path>
  </g>
</svg>

const arbitalStyles = (theme: ThemeType): JssStyles => ({
  hovercard: {
    padding: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    maxWidth: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '& h2': {
      marginTop: 4
    },
    "& a[href='https://arbital.com/edit/']": {
      color: theme.palette.error.main
    }
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  logo: {
    height: 24,
    fill: theme.palette.icon.dim2,
    marginTop: -5
  },
  link: {
    ...linkStyle(theme)
  }
})




const ArbitalPreview = ({classes, href, innerHTML, id}: {
  classes: ClassesType,
  href: string,
  innerHTML: string,
  id?: string,
}) => {
  const { AnalyticsTracker, LWPopper, ContentStyles } = Components
  const { anchorEl, hover, eventHandlers } = useHover();
  const [match, www, arbitalSlug] = href.match(/^http(?:s?):\/\/(www\.)?arbital\.com\/p\/([a-zA-Z0-9_]+)+/) || []

  const { data: rawData, loading } = useQuery(gql`
    query ArbitalPageRequest {
      ArbitalPageData(pageAlias: "${arbitalSlug}") {
        title
        html
      }
    }
  `, {
    ssr: true,
    skip: !arbitalSlug,
  });

  if (!arbitalSlug || loading) {
    return <Components.DefaultPreview href={href} innerHTML={innerHTML} id={id} />
  }

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <span {...eventHandlers}>
      <a className={classes.link} href={href} id={id} dangerouslySetInnerHTML={{__html: innerHTML}} />
      
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
        <Card>
          <ContentStyles contentType="comment" className={classes.hovercard}>
            <div className={classes.headerRow}>
              <a href={href}><h2>{rawData?.ArbitalPageData?.title}</h2></a>
              <a href="https://arbital.com" title="This article is hosted on Arbital.com"><div className={classes.logo}><ArbitalLogo/></div></a>
            </div>
            <div dangerouslySetInnerHTML={{__html: rawData?.ArbitalPageData?.html}} id={id} />
          </ContentStyles>
        </Card>
      </LWPopper>
    </span>
  </AnalyticsTracker>
}

const ArbitalPreviewComponent = registerComponent('ArbitalPreview', ArbitalPreview, {
  styles: arbitalStyles
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
    MetaculusPreview: typeof MetaculusPreviewComponent,
    ManifoldPreview: typeof ManifoldPreviewComponent,
    MetaforecastPreview: typeof MetaforecastPreviewComponent,
    OWIDPreview: typeof OWIDPreviewComponent,
    ArbitalPreview: typeof ArbitalPreviewComponent,
    DefaultPreview: typeof DefaultPreviewComponent,
    SequencePreview: typeof SequencePreviewComponent
  }
}
