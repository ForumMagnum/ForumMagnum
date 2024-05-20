import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import React, { FC, useState, useCallback, useEffect } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useSingle } from '../../lib/crud/withSingle';
import { nofollowKarmaThreshold } from '../../lib/publicSettings';
import { useForeignCrosspost, isPostWithForeignId, PostWithForeignId } from "../hooks/useForeignCrosspost";
import { useForeignApolloClient } from "../hooks/useForeignApolloClient";
import { captureException }from "@sentry/core";
import classNames from 'classnames';
import { truncateWithGrace } from '../common/ContentItemTruncated';
import { useRecordPostView } from '../hooks/useRecordPostView';

const styles = (theme: ThemeType) => ({
  root: {

    '& .read-more-button': {
      // color: theme.palette.primary.main,
      opacity: 0.7,
    }
  },
  expandedTextBody: {
    marginBottom: 10,
  },
  highlightContinue: {
    marginTop:theme.spacing.unit*2,
    fontFamily: theme.palette.fonts.sansSerifStack,
    '&& a, && a:hover': {
      color: theme.palette.primary.main,
    },
  },
})

const TruncatedSuffix: FC<{
  post: PostsList,
  wordsLeft: number,
}> = ({post, wordsLeft}) => {
  return (
    <Link to={postGetPageUrl(post)} eventProps={{intent: 'expandPost'}}>
        {`(Continue Reading - ${wordsLeft} words more)`}
    </Link>
  );
}

const foreignFetchProps = {
  collectionName: "Posts",
  fragmentName: "PostsList",
} as const;

const expandedFetchProps = {
  collectionName: "Posts",
  fragmentName: "PostsExpandedHighlight",
  fetchPolicy: "cache-first",
} as const;

const FeedPostHighlightBody = ({
  post,
  maxCollapsedLengthWords,
  expanded,
  setExpanded,
  expandedLoading,
  expandedDocument,
  classes,
}: {
  post: PostsList,
  maxCollapsedLengthWords: number,
  expanded: boolean,
  setExpanded: (value: boolean) => void,
  expandedLoading: boolean,
  expandedDocument?: PostsExpandedHighlight,
  classes: ClassesType,
}) => {
  const { htmlHighlight = "", wordCount = 0 } = post.contents || {};

  const { recordPostView } = useRecordPostView(post); 

  const clickExpand = useCallback((ev: MouseEvent) => {
    setExpanded(true);
    ev.preventDefault();
    void recordPostView({post, extraEventProperties: {type: 'expandPostCard'}});
  }, [setExpanded, recordPostView, post]);


  const maxLengthWords = expanded ? 1000 : maxCollapsedLengthWords;

  const html = expandedDocument?.contents?.html || htmlHighlight
  const rawWordCount = wordCount ?? 0;
  const readMoreId = `feed-post-read-more-${post._id}`;

  const styles = html.match(/<style[\s\S]*?<\/style>/g) || ""
  const suffix = expanded ? undefined : `... <span id="${readMoreId}" class="read-more-button">(read more)</span>${styles}`

  useEffect(() => {
    const readMoreButton = document.getElementById(readMoreId);
    readMoreButton?.addEventListener('click', clickExpand);
    return () => {
      readMoreButton?.removeEventListener('click', clickExpand);
    } 
  }, [readMoreId, clickExpand]);

  const {truncatedHtml, wasTruncated, wordsLeft} =  truncateWithGrace(html, maxLengthWords, 20, rawWordCount, suffix);

  return <Components.ContentStyles contentType="postHighlight" className={classes.root}>
    <Components.ContentItemBody
      dangerouslySetInnerHTML={{__html: truncatedHtml}}
      description={`post ${post._id}`}
      nofollow={(post.user?.karma || 0) < nofollowKarmaThreshold.get()}
      className={classNames({[classes.expandedTextBody]: expanded})}
    />
    {expanded && wasTruncated && <TruncatedSuffix
      post={post}
      wordsLeft={wordsLeft}
    />}
    {expandedLoading && expanded && <Components.Loading/>}
  </Components.ContentStyles>
}

const FeedForeignPostsHighlightBody = ({post, maxCollapsedLengthWords, forceSeeMore=false, smallerFonts, loading, classes}: {
  post: PostsList & PostWithForeignId,
  maxCollapsedLengthWords: number,
  forceSeeMore?: boolean,
  smallerFonts?: boolean,
  loading: boolean,
  classes: ClassesType,
}) => {
  const [expanded, setExpanded] = useState(false);
  const apolloClient = useForeignApolloClient();
  const {document: expandedDocument, loading: expandedLoading} = useSingle({
    skip: !expanded && !!post.contents,
    documentId: post.fmCrosspost.foreignPostId,
    apolloClient,
    ...expandedFetchProps,
  });

  return loading
    ? <Components.Loading />
    : <FeedPostHighlightBody {...{
      post,
      maxCollapsedLengthWords,
      forceSeeMore,
      smallerFonts,
      expanded,
      setExpanded,
      expandedLoading,
      expandedDocument,
      classes,
    }} />
}

const FeedForeignPostsHighlight = ({post, maxCollapsedLengthWords, forceSeeMore=false, smallerFonts, classes}: {
  post: PostsList & PostWithForeignId,
  maxCollapsedLengthWords: number,
  forceSeeMore?: boolean,
  smallerFonts?: boolean,
  classes: ClassesType,
}) => {
  const {loading, error, combinedPost} = useForeignCrosspost(post, foreignFetchProps);
  post = combinedPost ?? post;
  if (error) {
    captureException(error);
  }
  return error
    ? <FeedLocalPostsHighlight {...{post, maxCollapsedLengthWords, forceSeeMore, smallerFonts, classes}} />
    : <FeedForeignPostsHighlightBody {...{post, maxCollapsedLengthWords, forceSeeMore, smallerFonts, loading, classes}} />;
}

const FeedLocalPostsHighlight = ({post, maxCollapsedLengthWords, forceSeeMore=false, smallerFonts, classes}: {
  post: PostsList,
  maxCollapsedLengthWords: number,
  forceSeeMore?: boolean,
  smallerFonts?: boolean,
  classes: ClassesType,
}) => {
  const [expanded, setExpanded] = useState(false);
  const {document: expandedDocument, loading: expandedLoading} = useSingle({
    skip: !expanded && !!post.contents,
    documentId: post._id,
    ...expandedFetchProps,
  });

  return <FeedPostHighlightBody {...{
    post,
    maxCollapsedLengthWords,
    forceSeeMore,
    smallerFonts,
    expanded,
    setExpanded,
    expandedLoading,
    expandedDocument,
    classes,
  }} />
};

const FeedPostsHighlight = ({post, ...rest}: {
  post: PostsList,
  maxCollapsedLengthWords: number,
  initiallyExpanded?: boolean,
  forceSeeMore?: boolean,
  classes: ClassesType,
}) => isPostWithForeignId(post)
  ? <FeedForeignPostsHighlight post={post} {...rest} />
  : <FeedLocalPostsHighlight post={post} {...rest} />;

const FeedPostsHighlightComponent = registerComponent('FeedPostsHighlight', FeedPostsHighlight, {styles});

declare global {
  interface ComponentTypes {
    FeedPostsHighlight: typeof FeedPostsHighlightComponent
  }
}
