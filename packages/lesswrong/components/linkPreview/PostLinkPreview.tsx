import React, { ReactNode } from 'react';
import { gql, useQuery } from '@apollo/client';
import Card from '@/lib/vendor/@material-ui/core/src/Card';
import SupervisorAccountIcon from '@/lib/vendor/@material-ui/icons/src/SupervisorAccount';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from '../../lib/reactRouterWrapper';
import { looksLikeDbIdString } from '../../lib/routeUtil';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCommentByLegacyId } from '../comments/useComment';
import { useHover } from '../common/withHover';
import { usePostByLegacyId, usePostBySlug } from '../posts/usePost';
import { isClient } from '../../lib/executionEnvironment';
import { isFriendlyUI } from '../../themes/forumTheme';
import classNames from 'classnames';
import { visitedLinksHaveFilledInCircle } from '@/lib/betas';
import { ArbitalLogo } from '../icons/ArbitalLogo';

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

const PostLinkPreview = ({href, targetLocation, id, children}: {
  href: string,
  targetLocation: any,
  id: string,
  children: ReactNode,
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
    href={href} id={id}
  >
    {children}
  </Components.PostLinkPreviewVariantCheck>
}
const PostLinkPreviewComponent = registerComponent('PostLinkPreview', PostLinkPreview);

const PostLinkPreviewSequencePost = ({href, targetLocation, id, children}: {
  href: string,
  targetLocation: any,
  id: string,
  children: ReactNode,
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

  return <Components.PostLinkPreviewVariantCheck post={post||null} targetLocation={targetLocation} error={error} href={href} id={id}>
    {children}
  </Components.PostLinkPreviewVariantCheck>
}
const PostLinkPreviewSequencePostComponent = registerComponent('PostLinkPreviewSequencePost', PostLinkPreviewSequencePost);

const PostLinkPreviewSlug = ({href, targetLocation, id, children}: {
  href: string,
  targetLocation: any,
  id: string,
  children: ReactNode,
}) => {
  const slug = targetLocation.params.slug;
  const { post, error } = usePostBySlug({ slug });

  return <Components.PostLinkPreviewVariantCheck href={href} post={post} targetLocation={targetLocation} error={error} id={id}>
    {children}
  </Components.PostLinkPreviewVariantCheck>
}
const PostLinkPreviewSlugComponent = registerComponent('PostLinkPreviewSlug', PostLinkPreviewSlug);

const PostLinkPreviewLegacy = ({href, targetLocation, id, children}: {
  href: string,
  targetLocation: any,
  id: string,
  children: ReactNode,
}) => {
  const legacyId = targetLocation.params.id;
  const { post, error } = usePostByLegacyId({ legacyId });

  return <Components.PostLinkPreviewVariantCheck href={href} post={post} targetLocation={targetLocation} error={error} id={id}>
    {children}
  </Components.PostLinkPreviewVariantCheck>
}
const PostLinkPreviewLegacyComponent = registerComponent('PostLinkPreviewLegacy', PostLinkPreviewLegacy);

const CommentLinkPreviewLegacy = ({href, targetLocation, id, children}: {
  href: string,
  targetLocation: any,
  id: string,
  children: ReactNode,
}) => {
  const legacyPostId = targetLocation.params.id;
  const legacyCommentId = targetLocation.params.commentId;

  const { post, error: postError } = usePostByLegacyId({ legacyId: legacyPostId });
  const { comment, error: commentError } = useCommentByLegacyId({ legacyId: legacyCommentId });
  const error = postError || commentError;

  if (comment) {
    return <Components.CommentLinkPreviewWithComment comment={comment} post={post} error={error} href={href} id={id}>
      {children}
    </Components.CommentLinkPreviewWithComment>
  }
  return <Components.PostLinkPreviewWithPost href={href} post={post} error={error} id={id}>
    {children}
  </Components.PostLinkPreviewWithPost>
}
const CommentLinkPreviewLegacyComponent = registerComponent('CommentLinkPreviewLegacy', CommentLinkPreviewLegacy);

const PostCommentLinkPreviewGreaterWrong = ({href, targetLocation, id, children}: {
  href: string,
  targetLocation: any,
  id: string,
  children: ReactNode
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
  return <Components.PostLinkCommentPreview href={href} commentId={commentId} post={post||null} id={id}>
    {children}
  </Components.PostLinkCommentPreview>
}
const PostCommentLinkPreviewGreaterWrongComponent = registerComponent('PostCommentLinkPreviewGreaterWrong', PostCommentLinkPreviewGreaterWrong);

const PostLinkPreviewVariantCheck = ({ href, post, targetLocation, comment, commentId, error, id, children}: {
  href: string,
  post: PostsList|null,
  targetLocation: any,
  comment?: any,
  commentId?: string,
  error: any,
  id: string,
  children: ReactNode,
}) => {
  if (targetLocation.query.commentId) {
    return <PostLinkCommentPreview commentId={targetLocation.query.commentId} href={href} post={post} id={id}>
      {children}
    </PostLinkCommentPreview>
  }
  if (targetLocation.hash) {
    const commentId = targetLocation.hash.split("#")[1]
    if (looksLikeDbIdString(commentId)) {
      return <PostLinkCommentPreview commentId={commentId} href={href} post={post} id={id}>
        {children}
      </PostLinkCommentPreview>
    }
  }

  if (commentId) {
    return <Components.PostLinkCommentPreview commentId={commentId} post={post} href={href} id={id}>
      {children}
    </Components.PostLinkCommentPreview>
  }

  return <Components.PostLinkPreviewWithPost href={href} post={post} error={error} id={id}>
    {children}
  </Components.PostLinkPreviewWithPost>
}
const PostLinkPreviewVariantCheckComponent = registerComponent('PostLinkPreviewVariantCheck', PostLinkPreviewVariantCheck);

export const linkStyle = (theme: ThemeType) => (
  visitedLinksHaveFilledInCircle
    ? {
      link: {
        '&:after': {
          content: '""',
          top: -7,
          position: "relative",
          marginLeft: 2,
          marginRight: 0,
          width: 4,
          height: 4,
          display: "inline-block",
          
          // The center of the link-circle is the page-background color, rather
          // than transparent, because :visited cannot change background
          // opacity. Technically, this means that if a link appears on a
          // non-default background, the center of the circle is the wrong
          // color. I'm able to detect this on even-numbered replies (which
          // have a gray background) if I use a magnifier/color-picker, but
          // can't detect it by eye, so this is probably fine.
          background: theme.palette.background.default,
          border: `1.2px solid ${theme.palette.link.color ?? theme.palette.primary.main}`,
          borderRadius: "50%",
        },

        // Visited styles can be applied for two reasons: based on the :visited
        // selector (which is applied by the browser based on local browser
        // history), or based on the .visited class (which is applied by link
        // components for logged-in users based on the read-status of the
        // destination, in the DB).
        //
        // `visited` is a string-classname rather than something that gets
        // prefixed, because some broadly-applied styles in `stylePiping` also use
        // it.
        //
        // Because of browser rules intended to prevent history-sniffing, the
        // attributes that can appear in this block, if it's applied via the
        // :visited selector rather than the .visited class, are highly
        // restricted. In particular, the `background` attribute can change
        // color, but it cannot change opacity.
        "&:visited:after, &.visited:after": {
          background: theme.palette.link.visited ?? theme.palette.primary.main,
          border: `1.2px solid ${theme.palette.link.visited ?? theme.palette.primary.main}`,
        },
      },
      redLink: {
        color: `${theme.palette.error.main} !important`,
        '&:after': {
          border: `1.2px solid ${theme.palette.error.main}`,
        },
        '&:visited:after, &.visited:after': {
          border: `1.2px solid ${theme.palette.error.main}`,
        },
      },
    } : {
      link: {
        '&:after': {
          content: '"°"',
          marginLeft: 1,
        },
      },
    }
);

const styles = (theme: ThemeType) => ({
  ...linkStyle(theme)
})

const PostLinkCommentPreview = ({href, commentId, post, id, children}: {
  href: string,
  commentId: string,
  post: PostsList|null,
  id: string,
  children: ReactNode,
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
    return <Components.CommentLinkPreviewWithComment comment={comment} post={post} error={error} href={href} id={id}>
      {children}
    </Components.CommentLinkPreviewWithComment>
  }
  return <Components.PostLinkPreviewWithPost href={href} post={post} error={error} id={id}>
    {children}
  </Components.PostLinkPreviewWithPost>
}
const PostLinkCommentPreviewComponent = registerComponent('PostLinkCommentPreview', PostLinkCommentPreview);

const PostLinkPreviewWithPost = ({href, post, id, children, classes}: {
  href: string,
  post: PostsList|null,
  id: string,
  error: any,
  children: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  if (!post) {
    return <span>
      <Link to={href}>
        {children}
      </Link>
    </span>
  }

  const hash = (href.indexOf("#") >= 0) ? (href.split("#")[1]) : undefined;
  const {PostsTooltip} = Components;
  const visited = post?.isRead;
  return (
    <PostsTooltip
      post={post}
      hash={hash}
      placement="bottom-start"
      clickable={!isFriendlyUI}
      As="span"
    >
      <Link className={classNames(classes.link, visited && "visited")} to={href} id={id} smooth>
        {children}
      </Link>
    </PostsTooltip>
  );
}
const PostLinkPreviewWithPostComponent = registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, {
  styles
});

const CommentLinkPreviewWithComment = ({classes, href, comment, post, id, children}: {
  classes: ClassesType<typeof styles>,
  href: string,
  comment: any,
  post: PostsList|null,
  id: string,
  error: any,
  children: ReactNode,
}) => {
  if (!comment) {
    return <span>
      <Link to={href}>
        {children}
      </Link>
    </span>
  }

  const {PostsTooltip} = Components;
  return (
    <PostsTooltip
      post={post}
      comment={comment}
      placement="bottom-start"
      As="span"
      clickable={!isFriendlyUI}
    >
      <Link className={classes.link} to={href} id={id}>
        {children}
      </Link>
    </PostsTooltip>
  );
}
const CommentLinkPreviewWithCommentComponent = registerComponent('CommentLinkPreviewWithComment', CommentLinkPreviewWithComment, {
  styles,
});

const SequencePreview = ({classes, targetLocation, href, children}: {
  classes: ClassesType<typeof styles>,
  targetLocation: any,
  href: string,
  children: ReactNode,
}) => {
  const {SequencesTooltip} = Components;
  const sequenceId = targetLocation.params._id;

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
    <SequencesTooltip
      sequence={sequence ?? null}
      placement="bottom-start"
      allowOverflow
    >
      <Link className={classes.link} to={href} id={sequenceId}>
        {children}
      </Link>
    </SequencesTooltip>
  );
}

const SequencePreviewComponent = registerComponent('SequencePreview', SequencePreview, {
  styles,
});

const defaultPreviewStyles = (theme: ThemeType) => ({
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

const DefaultPreview = ({classes, href, onsite=false, id, rel, children}: {
  classes: ClassesType<typeof defaultPreviewStyles>,
  href: string,
  onsite?: boolean,
  id?: string,
  rel?: string
  children: ReactNode,
}) => {
  const { LWPopper } = Components
  const { eventHandlers, hover, anchorEl } = useHover({
    eventProps: {
      pageElementContext: "linkPreview",
      hoverPreviewType: "DefaultPreview",
      href,
      onsite,
    },
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
        ? <Link to={href} id={id} rel={rel}>{children}</Link>
        : <Components.AnalyticsTracker eventType="link" eventProps={{to: href}}>
            <a href={href} id={id} rel={rel}>
              {children}
            </a>
          </Components.AnalyticsTracker>}
    </span>
  );
}
const DefaultPreviewComponent = registerComponent('DefaultPreview', DefaultPreview, {
  styles: defaultPreviewStyles,
});

const owidStyles = (theme: ThemeType) => ({
  iframeStyling: {
    width: 600,
    height: 375,
    border: "none",
    maxWidth: "100vw",
  },
  background: {},
  ...linkStyle(theme)
})

const OWIDPreview = ({classes, href, id, children}: {
  classes: ClassesType<typeof owidStyles>,
  href: string,
  id?: string,
  children: ReactNode,
}) => {
  const { AnalyticsTracker, LWPopper } = Components
  const { anchorEl, hover, eventHandlers } = useHover();
  const [match] = href.match(/^http(?:s?):\/\/ourworldindata\.org\/grapher\/.*/) || []

  if (!match) {
    return <a href={href}>
      {children}
    </a>
  }

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <span {...eventHandlers}>
      <a className={classes.link} href={href} id={id}>
        {children}
      </a>
      
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

const metaculusStyles = (theme: ThemeType) => ({
  background: {
    backgroundColor: theme.palette.panelBackground.metaculusBackground,
  },
  iframeStyling: {
    width: 400,
    height: 250, 
    border: "none",
    maxWidth: "100vw"
  },
  ...linkStyle(theme)
})

const MetaculusPreview = ({classes, href, id, children}: {
  classes: ClassesType<typeof metaculusStyles>,
  href: string,
  id?: string,
  children: ReactNode,
}) => {
  const { AnalyticsTracker, LWPopper } = Components
  const { anchorEl, hover, eventHandlers } = useHover();
  const [match, www, questionNumber] = href.match(/^http(?:s?):\/\/(www\.)?metaculus\.com\/questions\/([a-zA-Z0-9]{1,6})?/) || []

  if (!questionNumber) {
    return <a href={href}>
      {children}
    </a>  
  }

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <span {...eventHandlers}>
      <a className={classes.link} href={href} id={id}>
        {children}
      </a>
      
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

const fatebookStyles = (theme: ThemeType) => ({
  iframeStyling: {
    width: 560,
    height: 200,
    border: "none",
    maxWidth: "100vw",
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 3,
    boxShadow: theme.palette.boxShadow.eaCard,
  },
  link: linkStyle(theme),
})

const FatebookPreview = ({classes, href, id, children}: {
  classes: ClassesType<typeof fatebookStyles>,
  href: string,
  id?: string,
  children: ReactNode,
}) => {
  const { AnalyticsTracker, LWPopper } = Components;
  const { anchorEl, hover, eventHandlers } = useHover();

  const isEmbed = /^https?:\/\/fatebook\.io\/embed\/q\/[\w-]+$/.test(href);

  const [, questionSlug] = href.match(/^https?:\/\/fatebook\.io\/q\/(.+)$/) || [];

  if (!isEmbed && !questionSlug) {
    return (
      <a href={href}>
        {children}
      </a>
    );
  }

  const url = isEmbed ? href : `https://fatebook.io/embed/q/${questionSlug}?requireSignIn=false&compact=true`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classes.link} href={href} id={id}>
          {children}
        </a>

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.iframeStyling} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

const FatebookPreviewComponent = registerComponent('FatebookPreview', FatebookPreview, { styles: fatebookStyles })

const manifoldStyles = (theme: ThemeType) => ({
  iframeStyling: {
    width: 560,
    height: 405,
    border: "none",
    maxWidth: "100vw",
  },
  ...linkStyle(theme),
});

const ManifoldPreview = ({classes, href, id, children}: {
  classes: ClassesType<typeof manifoldStyles>;
  href: string;
  id?: string;
  children: ReactNode,
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
        {children}
      </a>
    );
  }

  const url = isEmbed ? href : `https://manifold.markets/embed/${userAndSlug}`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classes.link} href={href} id={id}>
          {children}
        </a>

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.iframeStyling} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

const ManifoldPreviewComponent = registerComponent('ManifoldPreview', ManifoldPreview, { styles: manifoldStyles })

const neuronpediaStyles = (theme: ThemeType) => ({
  iframeStyling: {
    width: "100%",
    height: 360,
    border: "1px solid",
    borderColor: theme.palette.grey[300],
    borderRadius: 6,
    maxWidth: 639,
  },
  ...linkStyle(theme),
});

const NeuronpediaPreview = ({classes, href, id, children}: {
  classes: ClassesType<typeof neuronpediaStyles>;
  href: string;
  id?: string;
  children: ReactNode,
}) => {
  const { AnalyticsTracker, LWPopper } = Components;
  const { anchorEl, hover, eventHandlers } = useHover();

  // test if it's already an embed url https://[www.]neuronpedia.org/[model]/[layer]/[index]?embed=true[...]
  const isEmbed = /https:\/\/(www\.)?neuronpedia\.org\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\/\d+\?embed=true/.test(href);

  // if it's not an embed link, match it as https://[www.]neuronpedia.org/[model]/[layer]/[index] make the embed url
  const results = href.match(/^https?:\/\/(www\.)?neuronpedia\.org\/([a-zA-Z0-9-/]+).*/) || [];
  if (!isEmbed && (!results || results.length === 0)) {
    return (
      <a href={href}>
        {children}
      </a>
    );
  }
  const slug = results[results.length - 1]
  
  // if it's an embed just use that url, otherwise add the embed query
  const url = isEmbed ? href : `https://neuronpedia.org/${slug}?embed=true`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classes.link} href={href} id={id}>
          {children}
        </a>

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.iframeStyling} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

const NeuronpediaPreviewComponent = registerComponent('NeuronpediaPreview', NeuronpediaPreview, { styles: neuronpediaStyles })

const metaforecastStyles = (theme: ThemeType) => ({
  iframeStyling: {
    width: 560,
    height: 405,
    border: "none",
    maxWidth: "100vw",
  },
  ...linkStyle(theme),
});

const MetaforecastPreview = ({classes, href, id, children}: {
  classes: ClassesType<typeof metaforecastStyles>;
  href: string;
  id?: string;
  children: ReactNode,
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
        {children}
      </a>
    );
  }

  const url = isEmbed ? href : `https://metaforecast.org/questions/embed/${questionId}`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classes.link} href={href} id={id}>
          {children}
        </a>

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.iframeStyling} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

const MetaforecastPreviewComponent = registerComponent('MetaforecastPreview', MetaforecastPreview, { styles: metaforecastStyles })


const arbitalStyles = (theme: ThemeType) => ({
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
  ...linkStyle(theme)
})




const ArbitalPreview = ({classes, href, id, children}: {
  classes: ClassesType<typeof arbitalStyles>,
  href: string,
  id?: string,
  children: ReactNode,
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
    return <Components.DefaultPreview href={href} id={id}>
      {children}
    </Components.DefaultPreview>
  }

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <span {...eventHandlers}>
      <a className={classes.link} href={href} id={id}>
        {children}
      </a>
      
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

const estimakerStyles = (theme: ThemeType) => ({
  iframeStyling: {
    width: 560,
    height: 405,
    border: "none",
    maxWidth: "100vw",
  },
  ...linkStyle(theme),
});

const EstimakerPreview = ({classes, href, id, children}: {
  classes: ClassesType<typeof estimakerStyles>,
  href: string,
  id?: string,
  children: ReactNode,
}) => {
  const { AnalyticsTracker, LWPopper } = Components;
  const { anchorEl, hover, eventHandlers } = useHover();

  // test if fits https://estimaker.app/_/$user/$slug
  const isEmbed = /^https?:\/\/estimaker\.app\/_\/.+$/.test(href);
  
  if (!isEmbed) {
    return (
      <a href={href}>
        {children}
      </a>
    );
  }

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classes.link} href={href} id={id}>
          {children}
        </a>
        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.iframeStyling} src={href} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

const EstimakerPreviewComponent = registerComponent('EstimakerPreview', EstimakerPreview, { styles: estimakerStyles })


const viewpointsStyles = (theme: ThemeType) => ({
  iframeStyling: {
    width: 560,
    height: 300,
    border: "none",
    maxWidth: "100vw",
  },
  ...linkStyle(theme),
});

const ViewpointsPreview = ({classes, href, id, children}: {
  classes: ClassesType<typeof viewpointsStyles>,
  href: string,
  id?: string,
  children: ReactNode,
}) => {
  const { AnalyticsTracker, LWPopper } = Components;
  const { anchorEl, hover, eventHandlers } = useHover();

  // test if fits https://viewpoints.xyz/embed/polls/$slug
  const isEmbed = /^https?:\/\/viewpoints\.xyz\/embed\/polls\/.+$/.test(href);

  // test if it fits https://viewpoints.xyz/polls/$slug
  const [, slug] = href.match(/^https?:\/\/viewpoints\.xyz\/polls\/([\w-]+)/) || [];

  if (!isEmbed && !slug) {
    return (
      <a href={href}>
        {children}
      </a>
    );
  }

  const url = isEmbed ? href : `https://viewpoints.xyz/embed/polls/${slug}`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: url }}>
      <span {...eventHandlers}>
        <a className={classes.link} href={href} id={id}>
          {children}
        </a>
        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.iframeStyling} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

const ViewpointsPreviewComponent = registerComponent('ViewpointsPreview', ViewpointsPreview, { styles: viewpointsStyles })

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
    FatebookPreview: typeof FatebookPreviewComponent,
    MetaculusPreview: typeof MetaculusPreviewComponent,
    ManifoldPreview: typeof ManifoldPreviewComponent,
    NeuronpediaPreview: typeof NeuronpediaPreviewComponent,
    MetaforecastPreview: typeof MetaforecastPreviewComponent,
    OWIDPreview: typeof OWIDPreviewComponent,
    ArbitalPreview: typeof ArbitalPreviewComponent,
    DefaultPreview: typeof DefaultPreviewComponent,
    SequencePreview: typeof SequencePreviewComponent,
    EstimakerPreview: typeof EstimakerPreviewComponent,
    ViewpointsPreview: typeof ViewpointsPreviewComponent,
  }
}
