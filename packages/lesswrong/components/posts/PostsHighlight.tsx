import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import React, {useState, useCallback} from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useSingle } from '../../lib/crud/withSingle';
import { nofollowKarmaThreshold } from '../../lib/publicSettings';
import { useForeignCrosspost, isPostWithForeignId, PostWithForeignId } from "../hooks/useForeignCrosspost";
import { useForeignApolloClient } from "../hooks/useForeignApolloClient";
import { captureException }from "@sentry/core";
import classNames from 'classnames';
import { isEAForum } from '../../lib/instanceSettings';
import { preferredHeadingCase } from '../../lib/forumTypeUtils';

const styles = (theme: ThemeType): JssStyles => ({
  highlightContinue: {
    marginTop:theme.spacing.unit*2,
    fontFamily: isEAForum ? theme.palette.fonts.sansSerifStack : undefined,
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
  classes: ClassesType,
}) => {
  const { htmlHighlight = "", wordCount = 0 } = post.contents || {};

  const clickExpand = useCallback((ev) => {
    setExpanded(true);
    ev.preventDefault();
  }, [setExpanded]);

  return <Components.ContentStyles contentType="postHighlight" className={classNames({[classes.smallerFonts]: smallerFonts})}>
    <Components.LinkPostMessage post={post} />
    <Components.ContentItemTruncated
      maxLengthWords={maxLengthWords}
      graceWords={20}
      rawWordCount={wordCount}
      expanded={expanded}
      getTruncatedSuffix={({wordsLeft}: {wordsLeft:number}) => <div className={classes.highlightContinue}>
        {(forceSeeMore || wordsLeft < 1000)
          ? <Link to={postGetPageUrl(post)} onClick={clickExpand}>
              ({preferredHeadingCase("See More")} – {wordsLeft} more words)
            </Link>
          : <Link to={postGetPageUrl(post)}>
              ({preferredHeadingCase("Continue Reading")}  – {wordsLeft} more words)
            </Link>
        }
      </div>}
      dangerouslySetInnerHTML={{__html: expandedDocument?.contents?.html || htmlHighlight}}
      description={`post ${post._id}`}
      nofollow={(post.user?.karma || 0) < nofollowKarmaThreshold.get()}
    />
    {expandedLoading && expanded && <Components.Loading/>}
  </Components.ContentStyles>
}

const ForeignPostsHighlightBody = ({post, maxLengthWords, forceSeeMore=false, smallerFonts, loading, classes}: {
  post: PostsList & PostWithForeignId,
  maxLengthWords: number,
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
  classes: ClassesType,
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
  classes: ClassesType,
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

const PostsHighlight = ({post, ...rest}: {
  post: PostsList,
  maxLengthWords: number,
  forceSeeMore?: boolean,
  smallerFonts?: boolean,
  classes: ClassesType,
}) => isPostWithForeignId(post)
  ? <ForeignPostsHighlight post={post} {...rest} />
  : <LocalPostsHighlight post={post} {...rest} />;

const PostsHighlightComponent = registerComponent('PostsHighlight', PostsHighlight, {styles});

declare global {
  interface ComponentTypes {
    PostsHighlight: typeof PostsHighlightComponent
  }
}
