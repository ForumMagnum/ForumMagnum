import React, { ReactNode } from 'react';
import { useQuery } from "@/lib/crud/useQuery";
import { Card } from "@/components/widgets/Paper";
import { Link } from '../../lib/reactRouterWrapper';
import { looksLikeDbIdString } from '../../lib/routeUtil';
import { useCommentByLegacyId } from '../comments/useComment';
import { useHover } from '../common/withHover';
import { usePostByLegacyId, usePostBySlug } from '../posts/usePost';
import { isClient } from '../../lib/executionEnvironment';
import { isFriendlyUI } from '../../themes/forumTheme';
import classNames from 'classnames';
import { ArbitalLogo } from '../icons/ArbitalLogo';
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles, useStyles } from '../hooks/useStyles';
import AnalyticsTracker from "../common/AnalyticsTracker";
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import SequencesTooltip from "../sequences/SequencesTooltip";
import LWPopper from "../common/LWPopper";
import ContentStyles from "../common/ContentStyles";
import { apolloSSRFlag } from '@/lib/helpers';
import type { RouterLocation } from '@/lib/vulcan-lib/routes';
import { linkStyles } from './linkStyles';


const SequencesPageFragmentQuery = gql(`
  query PostLinkPreviewSequence($documentId: String, $allowNull: Boolean) {
    sequence(input: { selector: { documentId: $documentId }, allowNull: $allowNull }) {
      result {
        ...SequencesPageFragment
      }
    }
  }
`);

const CommentsListQuery = gql(`
  query PostLinkPreviewComment($documentId: String, $allowNull: Boolean) {
    comment(input: { selector: { documentId: $documentId }, allowNull: $allowNull }) {
      result {
        ...CommentsList
      }
    }
  }
`);

const PostsListQuery = gql(`
  query PostLinkPreviewPost($documentId: String, $allowNull: Boolean) {
    post(input: { selector: { documentId: $documentId }, allowNull: $allowNull }) {
      result {
        ...PostsList
      }
    }
  }
`);

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
function logMissingLinkPreview(message: string) {
  if (isClient) {
    if(!missingLinkPreviewsLogged.has(message)) {
      missingLinkPreviewsLogged.add(message);
      //eslint-disable-next-line no-console
      console.log(message);
    }
  }
}

export const PostLinkPreview = ({href, targetLocation, id, className, children}: {
  href: string,
  targetLocation: RouterLocation,
  id: string,
  className?: string,
  children: ReactNode,
}) => {
  const postID = targetLocation.params._id;

  const { loading, error, data } = useQuery(PostsListQuery, {
    variables: {
      documentId: postID,
      allowNull: true,
    },
    fetchPolicy: 'cache-first',
    ssr: apolloSSRFlag(false),
  });
  const post = data?.post?.result;
  
  if ((!loading && !post) || error) {
    logMissingLinkPreview(`Link preview: No post found with ID ${postID}, error: ${error}`);
  }

  return <PostLinkPreviewVariantCheck
    post={post||null}
    targetLocation={targetLocation}
    error={error}
    href={href} id={id} className={className}
  >
    {children}
  </PostLinkPreviewVariantCheck>
}

export const PostLinkPreviewSequencePost = ({href, targetLocation, id, className, children}: {
  href: string,
  targetLocation: RouterLocation,
  id: string,
  className?: string,
  children: ReactNode,
}) => {
  const postID = targetLocation.params.postId;

  const { loading, error, data } = useQuery(PostsListQuery, {
    variables: { documentId: postID, allowNull: true },
    fetchPolicy: 'cache-first',
    ssr: false,
  });
  const post = data?.post?.result;

  if ((!loading && !post) || error ) {
    logMissingLinkPreview(`Link preview: No post found with ID ${postID}, error: ${error}`);
  }

  return <PostLinkPreviewVariantCheck post={post||null} targetLocation={targetLocation} error={error} href={href} id={id} className={className}>
    {children}
  </PostLinkPreviewVariantCheck>
}

export const PostLinkPreviewSlug = ({href, targetLocation, id, className, children}: {
  href: string,
  targetLocation: RouterLocation,
  id: string,
  className?: string,
  children: ReactNode,
}) => {
  const slug = targetLocation.params.slug;
  const { post, error } = usePostBySlug({ slug, ssr: false });

  return <PostLinkPreviewVariantCheck href={href} post={post} targetLocation={targetLocation} error={error} id={id} className={className}>
    {children}
  </PostLinkPreviewVariantCheck>
}

export const PostLinkPreviewLegacy = ({href, targetLocation, id, className, children}: {
  href: string,
  targetLocation: RouterLocation,
  id: string,
  className?: string,
  children: ReactNode,
}) => {
  const legacyId = targetLocation.params.id;
  const { post, error } = usePostByLegacyId({ legacyId, ssr: false });

  return <PostLinkPreviewVariantCheck href={href} post={post} targetLocation={targetLocation} error={error} id={id} className={className}>
    {children}
  </PostLinkPreviewVariantCheck>
}

export const CommentLinkPreviewLegacy = ({href, targetLocation, id, className, children}: {
  href: string,
  targetLocation: RouterLocation,
  id: string,
  className?: string,
  children: ReactNode,
}) => {
  const legacyPostId = targetLocation.params.id;
  const legacyCommentId = targetLocation.params.commentId;

  const { post, error: postError } = usePostByLegacyId({ legacyId: legacyPostId, ssr: false });
  const { comment, error: commentError } = useCommentByLegacyId({ legacyId: legacyCommentId, ssr: false });
  const error = postError || commentError;

  if (comment) {
    return <CommentLinkPreviewWithComment comment={comment} post={post} error={error} href={href} id={id} className={className}>
      {children}
    </CommentLinkPreviewWithComment>
  }
  return <PostLinkPreviewWithPost href={href} post={post} error={error} id={id} className={className}>
    {children}
  </PostLinkPreviewWithPost>
}

export const PostCommentLinkPreviewGreaterWrong = ({href, targetLocation, id, className, children}: {
  href: string,
  targetLocation: RouterLocation,
  id: string,
  className?: string,
  children: ReactNode
}) => {
  const postId = targetLocation.params._id;
  const commentId = targetLocation.params.commentId;

  const { loading, data, error   } = useQuery(PostsListQuery, {
    variables: { documentId: postId, allowNull: true },
    fetchPolicy: 'cache-first',
    ssr: false,
  });
  const post = data?.post?.result;

  if ((!loading && !post) || error) {
    logMissingLinkPreview(`Link preview: No post found with ID ${postId}, error: ${error}`);
  }
  return <PostLinkCommentPreview href={href} commentId={commentId} post={post||null} id={id} className={className}>
    {children}
  </PostLinkCommentPreview>
}

const PostLinkPreviewVariantCheck = ({ href, post, targetLocation, comment, commentId, error, id, className, children}: {
  href: string,
  post: PostsList|null,
  targetLocation: RouterLocation,
  comment?: any,
  commentId?: string,
  error: any,
  id: string,
  className?: string,
  children: ReactNode,
}) => {
  if (targetLocation.query.commentId) {
    return <PostLinkCommentPreview commentId={targetLocation.query.commentId} href={href} post={post} id={id} className={className}>
      {children}
    </PostLinkCommentPreview>
  }
  if (targetLocation.hash) {
    const commentId = targetLocation.hash.split("#")[1]
    if (looksLikeDbIdString(commentId)) {
      return <PostLinkCommentPreview commentId={commentId} href={href} post={post} id={id} className={className}>
        {children}
      </PostLinkCommentPreview>
    }
  }

  if (commentId) {
    return <PostLinkCommentPreview commentId={commentId} post={post} href={href} id={id} className={className}>
      {children}
    </PostLinkCommentPreview>
  }

  return <PostLinkPreviewWithPost href={href} post={post} error={error} id={id} className={className}>
    {children}
  </PostLinkPreviewWithPost>
}


const PostLinkCommentPreview = ({href, commentId, post, id, className, children}: {
  href: string,
  commentId: string,
  post: PostsList|null,
  id: string,
  className?: string,
  children: ReactNode,
}) => {

  const { loading, error, data } = useQuery(CommentsListQuery, {
    variables: { documentId: commentId, allowNull: true },
    fetchPolicy: 'cache-first',
    ssr: false,
  });
  const comment = data?.comment?.result;

  if ((!loading && !comment) || error) {
    logMissingLinkPreview(`Link preview: No comment found with ID ${commentId}, error: ${error}`);
  }
  if (comment) {
    return <CommentLinkPreviewWithComment comment={comment} post={post} error={error} href={href} id={id} className={className}>
      {children}
    </CommentLinkPreviewWithComment>
  }
  return <PostLinkPreviewWithPost href={href} post={post} error={error} id={id} className={className}>
    {children}
  </PostLinkPreviewWithPost>
}

const PostLinkPreviewWithPost = ({href, post, id, className, children}: {
  href: string,
  post: PostsList|null,
  id: string,
  className?: string,
  error: any,
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);

  if (!post) {
    return <Link to={href} className={classNames(classes.link, className)}>
      {children}
    </Link>
  }

  const hash = (href.indexOf("#") >= 0) ? (href.split("#")[1]) : undefined;
  const visited = post?.isRead;
  return (
    <PostsTooltip
      post={post}
      hash={hash}
      placement="bottom-start"
      clickable={!isFriendlyUI}
      As="span"
    >
      <Link className={classNames(classes.link, visited && "visited", className)} to={href} id={id} smooth>
        {children}
      </Link>
    </PostsTooltip>
  );
}

const CommentLinkPreviewWithComment = ({href, comment, post, id, className, children}: {
  href: string,
  comment: any,
  post: PostsList|null,
  id: string,
  className?: string,
  error: any,
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);

  if (!comment) {
    return <Link to={href} className={classNames(classes.link, className)}>
      {children}
    </Link>
  }
  return (
    <PostsTooltip
      post={post}
      comment={comment}
      placement="bottom-start"
      As="span"
      clickable={!isFriendlyUI}
    >
      <Link className={classNames(classes.link, className)} to={href} id={id}>
        {children}
      </Link>
    </PostsTooltip>
  );
}

export const SequencePreview = ({targetLocation, href, className, children}: {
  targetLocation: RouterLocation,
  href: string,
  className?: string,
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);
  
  const sequenceId = targetLocation.params._id;

  const { loading, data, error  } = useQuery(SequencesPageFragmentQuery, {
    variables: { documentId: sequenceId, allowNull: true },
    fetchPolicy: 'cache-first',
    ssr: false,
  });
  const sequence = data?.sequence?.result;

  if ((!sequence && !loading) || error) {
    logMissingLinkPreview(`Link preview: No sequence  found with ID ${sequenceId}, error: ${error}`);
  }

  return (
    <SequencesTooltip
      sequence={sequence ?? null}
      placement="bottom-start"
      allowOverflow
    >
      <Link className={classNames(classes.link, className)} to={href} id={sequenceId}>
        {children}
      </Link>
    </SequencesTooltip>
  );
}

const defaultPreviewStyles = defineStyles('DefaultPreview', (theme: ThemeType) => ({
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
}));

export const DefaultPreview = ({href, onsite=false, id, rel, className, children}: {
  href: string,
  onsite?: boolean,
  id?: string,
  rel?: string,
  className?: string,
  children: ReactNode,
}) => {
  const classes = useStyles(defaultPreviewStyles);

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
        ? <Link to={href} id={id} rel={rel} className={className}>{children}</Link>
        : <AnalyticsTracker eventType="link" eventProps={{to: href}}>
            <a href={href} id={id} rel={rel} className={className}>
              {children}
            </a>
          </AnalyticsTracker>}
    </span>
  );
}

export const OWIDPreview = ({href, id, className, children}: {
  href: string,
  id?: string,
  className?: string,
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);
  const { anchorEl, hover, eventHandlers } = useHover();
  const [match] = href.match(/^http(?:s?):\/\/ourworldindata\.org\/grapher\/.*/) || []

  if (!match) {
    return <a href={href} className={className}>
      {children}
    </a>
  }

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <span {...eventHandlers}>
      <a className={classNames(classes.link, className)} href={href} id={id}>
        {children}
      </a>
      
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
        <div className={classes.owidBackground}>
          <iframe className={classes.owidIframe} src={match} />
        </div>
      </LWPopper>
    </span>
  </AnalyticsTracker>
}

export const MetaculusPreview = ({href, id, className, children}: {
  href: string,
  id?: string,
  className?: string,
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);

  const { anchorEl, hover, eventHandlers } = useHover();
  const [match, www, questionNumber] = href.match(/^http(?:s?):\/\/(www\.)?metaculus\.com\/questions\/([a-zA-Z0-9]{1,6})?/) || []

  if (!questionNumber) {
    return <a href={href} className={className}>
      {children}
    </a>  
  }

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <span {...eventHandlers}>
      <a className={classNames(classes.link, className)} href={href} id={id}>
        {children}
      </a>
      
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
        <div className={classes.metaculusBackground}>
          <iframe className={classes.metaculusIframe} src={`https://d3s0w6fek99l5b.cloudfront.net/s/1/questions/embed/${questionNumber}/?plot=pdf`} />
        </div>
      </LWPopper>
    </span>
  </AnalyticsTracker>
}

export const FatebookPreview = ({href, id, className, children}: {
  href: string,
  id?: string,
  className?: string,
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);
  
  const { anchorEl, hover, eventHandlers } = useHover();

  const isEmbed = /^https?:\/\/fatebook\.io\/embed\/q\/[\w-]+$/.test(href);

  const [, questionSlug] = href.match(/^https?:\/\/fatebook\.io\/q\/(.+)$/) || [];

  if (!isEmbed && !questionSlug) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  const url = isEmbed ? href : `https://fatebook.io/embed/q/${questionSlug}?requireSignIn=false&compact=true`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classNames(classes.link, className)} href={href} id={id}>
          {children}
        </a>

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.fatebookIframe} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

export const ManifoldPreview = ({href, id, className, children}: {
  href: string;
  id?: string;
  className?: string;
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);
  const { anchorEl, hover, eventHandlers } = useHover();

  // test if fits https://manifold.markets/embed/[...]
  const isEmbed = /^https?:\/\/manifold\.markets\/embed\/.+$/.test(href);

  // if it fits  https://manifold.markets/[username]/[market-slug] instead, get the (username and market slug)
  const [, userAndSlug] = href.match(/^https?:\/\/manifold\.markets\/(\w+\/[\w-]+)/) || [];

  if (!isEmbed && !userAndSlug) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  const url = isEmbed ? href : `https://manifold.markets/embed/${userAndSlug}`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classNames(classes.link, className)} href={href} id={id}>
          {children}
        </a>

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.manifoldIframe} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

export const NeuronpediaPreview = ({href, id, className, children}: {
  href: string;
  id?: string;
  className?: string;
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);
  const { anchorEl, hover, eventHandlers } = useHover();

  // test if it's already an embed url https://[www.]neuronpedia.org/[model]/[layer]/[index]?embed=true[...]
  const isEmbed = /https:\/\/(www\.)?neuronpedia\.org\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\/\d+\?embed=true/.test(href);

  // if it's not an embed link, match it as https://[www.]neuronpedia.org/[model]/[layer]/[index] make the embed url
  const results = href.match(/^https?:\/\/(www\.)?neuronpedia\.org\/([a-zA-Z0-9-/]+).*/) || [];
  if (!isEmbed && (!results || results.length === 0)) {
    return (
      <a href={href} className={className}>
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
        <a className={classNames(classes.link, className)} href={href} id={id}>
          {children}
        </a>

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.neuronpediaIframe} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

export const MetaforecastPreview = ({href, id, className, children}: {
  href: string;
  id?: string;
  className?: string;
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);
  const { anchorEl, hover, eventHandlers } = useHover();

  // test if fits https://metaforecast.org/questions/embed/[...]
  const isEmbed = /^https?:\/\/metaforecast\.org\/questions\/embed\/.+$/.test(href);

  // test if it fits https://manifold.markets/questions/[...] instead
  const [, questionId] = href.match(/^https?:\/\/metaforecast\.org\/questions\/([\w-]+)/) || [];

  if (!isEmbed && !questionId) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  const url = isEmbed ? href : `https://metaforecast.org/questions/embed/${questionId}`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classNames(classes.link, className)} href={href} id={id}>
          {children}
        </a>

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.metaforecastIframe} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};


const arbitalStyles = defineStyles('ArbitalPreview', (theme: ThemeType) => ({
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
}));

export const ArbitalPreview = ({href, id, className, children}: {
  href: string,
  id?: string,
  className?: string,
  children: ReactNode,
}) => {
  const classes = useStyles(arbitalStyles);
  const linkClasses = useStyles(linkStyles);

  const { anchorEl, hover, eventHandlers } = useHover();
  const [match, www, arbitalSlug] = href.match(/^http(?:s?):\/\/(www\.)?arbital\.com\/p\/([a-zA-Z0-9_]+)+/) || []

  const { data: rawData, loading } = useQuery(gql(`
    query ArbitalPageRequest($arbitalSlug: String!) {
      ArbitalPageData(pageAlias: $arbitalSlug) {
        title
        html
      }
    }
  `), {
    ssr: false,
    skip: !arbitalSlug,
    variables: {
      arbitalSlug,
    },
  });

  if (!arbitalSlug || loading) {
    return <DefaultPreview href={href} id={id} className={className}>
      {children}
    </DefaultPreview>
  }

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <span {...eventHandlers}>
      <a className={classNames(linkClasses.link, className)} href={href} id={id}>
        {children}
      </a>
      
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
        <Card>
          <ContentStyles contentType="comment" className={classes.hovercard}>
            <div className={classes.headerRow}>
              <a href={href}><h2>{rawData?.ArbitalPageData?.title}</h2></a>
              <a href="https://arbital.com" title="This article is hosted on Arbital.com"><div className={classes.logo}><ArbitalLogo/></div></a>
            </div>
            <div dangerouslySetInnerHTML={{__html: rawData?.ArbitalPageData?.html ?? ""}} id={id} />
          </ContentStyles>
        </Card>
      </LWPopper>
    </span>
  </AnalyticsTracker>
}

export const EstimakerPreview = ({href, id, className, children}: {
  href: string,
  id?: string,
  className?: string,
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);
  const { anchorEl, hover, eventHandlers } = useHover();

  // test if fits https://estimaker.app/_/$user/$slug
  const isEmbed = /^https?:\/\/estimaker\.app\/_\/.+$/.test(href);
  
  if (!isEmbed) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a className={classNames(classes.link, className)} href={href} id={id}>
          {children}
        </a>
        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.estimakerIframe} src={href} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

export const ViewpointsPreview = ({href, id, className, children}: {
  href: string,
  id?: string,
  className?: string,
  children: ReactNode,
}) => {
  const classes = useStyles(linkStyles);
  const { anchorEl, hover, eventHandlers } = useHover();

  // test if fits https://viewpoints.xyz/embed/polls/$slug
  const isEmbed = /^https?:\/\/viewpoints\.xyz\/embed\/polls\/.+$/.test(href);

  // test if it fits https://viewpoints.xyz/polls/$slug
  const [, slug] = href.match(/^https?:\/\/viewpoints\.xyz\/polls\/([\w-]+)/) || [];

  if (!isEmbed && !slug) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  const url = isEmbed ? href : `https://viewpoints.xyz/embed/polls/${slug}`;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: url }}>
      <span {...eventHandlers}>
        <a className={classNames(classes.link, className)} href={href} id={id}>
          {children}
        </a>
        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <iframe className={classes.viewpointsIframe} src={url} />
        </LWPopper>
      </span>
    </AnalyticsTracker>
  );
};

