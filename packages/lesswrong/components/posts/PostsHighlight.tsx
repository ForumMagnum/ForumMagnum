import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import React, { FC, MouseEvent, useState, useCallback } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useSingle } from '../../lib/crud/withSingle';
import { nofollowKarmaThreshold } from '../../lib/publicSettings';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import classNames from 'classnames';

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
  wordsLeft: number,
  clickExpand: (ev: MouseEvent) => void,
}> = ({post, forceSeeMore, wordsLeft, clickExpand}) => {
  if (forceSeeMore || wordsLeft < 1000) {
    return (
      <Link
        to={postGetPageUrl(post)}
        onClick={clickExpand}
        eventProps={{intent: 'expandPost'}}
      >
        ({preferredHeadingCase("See More")} – {wordsLeft} more words)
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

  return <Components.ContentStyles contentType="postHighlight" className={classNames({[classes.smallerFonts]: smallerFonts})}>
    <Components.LinkPostMessage post={post} />
    <Components.ContentItemTruncated
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
    {expandedLoading && expanded && <Components.Loading/>}
  </Components.ContentStyles>
}

const PostsHighlight = ({post, maxLengthWords, forceSeeMore=false, smallerFonts, classes}: {
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

const PostsHighlightComponent = registerComponent('PostsHighlight', PostsHighlight, {styles});

declare global {
  interface ComponentTypes {
    PostsHighlight: typeof PostsHighlightComponent
  }
}
