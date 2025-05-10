import { registerComponent } from '../../lib/vulcan-lib/components';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import React, { FC, MouseEvent, useState, useCallback } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useSingle } from '../../lib/crud/withSingle';
import { nofollowKarmaThreshold } from '../../lib/publicSettings';
import { useForeignCrosspost, isPostWithForeignId, PostWithForeignId } from "../hooks/useForeignCrosspost";
import { useForeignApolloClient } from "../hooks/useForeignApolloClient";
import { captureException }from "@sentry/core";
import classNames from 'classnames';

import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { ContentStyles } from "../common/ContentStyles";
import { LinkPostMessage } from "./LinkPostMessage";
import { ContentItemTruncated } from "../common/ContentItemTruncated";
import { Loading } from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  highlightContinue: {
    marginTop:theme.spacing.unit*2,
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
    '&& a, && a:hover': {
      color: theme.palette.primary.main,
    },
  },
  smallerFonts: {
    fontSize: '1.1rem',
    lineHeight: '1.7em',
    '& h1, & h2, & h3': {
      fontSize: "1.4rem",
    },
    '& li': {
      fontSize: '1.1rem'
    }
  }
})

const TruncatedSuffix: FC<{
  post: PostsList,
  forceSeeMore?: boolean,
  wordsLeft: number|null,
  clickExpand: (ev: MouseEvent) => void,
}> = ({post, forceSeeMore, wordsLeft, clickExpand}) => {
  if (forceSeeMore || (wordsLeft && wordsLeft < 1000)) {
    return (
      <Link
        to={postGetPageUrl(post)}
        onClick={clickExpand}
        eventProps={{intent: 'expandPost'}}
      >
        {"("}{preferredHeadingCase("See More")}
        {wordsLeft && <>{" – "}{wordsLeft} more words</>}{")"}
      </Link>
    );
  }
  return (
    <Link to={postGetPageUrl(post)} eventProps={{intent: 'expandPost'}}>
      {isFriendlyUI
        ? "Continue reading"
        : `(Continue Reading – ${wordsLeft} more words)`
      }
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

const HighlightBody = ({
  post,
  maxLengthWords,
  forceSeeMore=false,
  expanded,
  setExpanded,
  expandedLoading,
  expandedDocument,
  smallerFonts,
  classes,
}: {
  post: PostsList,
  maxLengthWords: number,
  forceSeeMore?: boolean,
  expanded: boolean,
  setExpanded: (value: boolean) => void,
  expandedLoading: boolean,
  expandedDocument?: PostsExpandedHighlight,
  smallerFonts?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { htmlHighlight = "", wordCount = 0 } = post.contents || {};

  const clickExpand = useCallback((ev: MouseEvent) => {
    setExpanded(true);
    ev.preventDefault();
  }, [setExpanded]);

  return <ContentStyles contentType="postHighlight" className={classNames({[classes.smallerFonts]: smallerFonts})}>
    <LinkPostMessage post={post} />
    <ContentItemTruncated
      maxLengthWords={maxLengthWords}
      graceWords={20}
      rawWordCount={wordCount ?? 0}
      expanded={expanded}
      getTruncatedSuffix={({wordsLeft}: {wordsLeft: number}) =>
        <div className={classes.highlightContinue}>
          <TruncatedSuffix
            post={post}
            forceSeeMore={forceSeeMore}
            wordsLeft={wordsLeft}
            clickExpand={clickExpand}
          />
        </div>
      }
      dangerouslySetInnerHTML={{__html: expandedDocument?.contents?.html || htmlHighlight}}
      description={`post ${post._id}`}
      nofollow={(post.user?.karma || 0) < nofollowKarmaThreshold.get()}
    />
    {expandedLoading && expanded && <Loading/>}
  </ContentStyles>
}

const ForeignPostsHighlightBody = ({post, maxLengthWords, forceSeeMore=false, smallerFonts, loading, classes}: {
  post: PostsList & PostWithForeignId,
  maxLengthWords: number,
  forceSeeMore?: boolean,
  smallerFonts?: boolean,
  loading: boolean,
  classes: ClassesType<typeof styles>,
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
    ? <Loading />
    : <HighlightBody {...{
      post,
      maxLengthWords,
      forceSeeMore,
      smallerFonts,
      expanded,
      setExpanded,
      expandedLoading,
      expandedDocument,
      classes,
    }} />
}

const ForeignPostsHighlight = ({post, maxLengthWords, forceSeeMore=false, smallerFonts, classes}: {
  post: PostsList & PostWithForeignId,
  maxLengthWords: number,
  forceSeeMore?: boolean,
  smallerFonts?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const {loading, error, combinedPost} = useForeignCrosspost(post, foreignFetchProps);
  post = combinedPost ?? post;
  if (error) {
    captureException(error);
  }
  return error
    ? <LocalPostsHighlight {...{post, maxLengthWords, forceSeeMore, smallerFonts, classes}} />
    : <ForeignPostsHighlightBody {...{post, maxLengthWords, forceSeeMore, smallerFonts, loading, classes}} />;
}

const LocalPostsHighlight = ({post, maxLengthWords, forceSeeMore=false, smallerFonts, classes}: {
  post: PostsList,
  maxLengthWords: number,
  forceSeeMore?: boolean,
  smallerFonts?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const [expanded, setExpanded] = useState(false);
  const {document: expandedDocument, loading: expandedLoading} = useSingle({
    skip: !expanded && !!post.contents,
    documentId: post._id,
    ...expandedFetchProps,
  });

  return <HighlightBody {...{
    post,
    maxLengthWords,
    forceSeeMore,
    smallerFonts,
    expanded,
    setExpanded,
    expandedLoading,
    expandedDocument,
    classes,
  }} />
};

const PostsHighlightInner = ({post, ...rest}: {
  post: PostsList,
  maxLengthWords: number,
  forceSeeMore?: boolean,
  smallerFonts?: boolean,
  classes: ClassesType<typeof styles>,
}) => isPostWithForeignId(post)
  ? <ForeignPostsHighlight post={post} {...rest} />
  : <LocalPostsHighlight post={post} {...rest} />;

export const PostsHighlight = registerComponent('PostsHighlight', PostsHighlightInner, {styles});


