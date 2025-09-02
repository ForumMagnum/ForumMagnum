import { registerComponent } from '../../lib/vulcan-lib/components';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import React, { FC, MouseEvent, useState, useCallback } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { nofollowKarmaThreshold } from '@/lib/instanceSettings';
import classNames from 'classnames';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import ContentStyles from "../common/ContentStyles";
import LinkPostMessage from "./LinkPostMessage";
import ContentItemTruncated from "../common/ContentItemTruncated";
import Loading from "../vulcan-core/Loading";

const PostsExpandedHighlightQuery = gql(`
  query PostsHighlight($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsExpandedHighlight
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  highlightContinue: {
    marginTop:theme.spacing.unit*2,
    fontFamily: theme.isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
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
  const moreWordsText = (wordsLeft !== null)
    ? ` - ${wordsLeft} more words`
    : "";
  if (forceSeeMore || (wordsLeft && wordsLeft < 1000)) {
    return (
      <Link
        to={postGetPageUrl(post)}
        onClick={clickExpand}
        eventProps={{intent: 'expandPost'}}
      >
        {`(${preferredHeadingCase("See More")}${moreWordsText})`}
      </Link>
    );
  }
  return (
    <Link to={postGetPageUrl(post)} eventProps={{intent: 'expandPost'}}>
      {isFriendlyUI()
        ? "Continue reading"
        : `(Continue Reading${moreWordsText})`
      }
    </Link>
  );
}

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


const PostsHighlight = ({post, maxLengthWords, forceSeeMore=false, smallerFonts, classes}: {
  post: PostsList,
  maxLengthWords: number,
  forceSeeMore?: boolean,
  smallerFonts?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { loading: expandedLoading, data } = useQuery(PostsExpandedHighlightQuery, {
    variables: { documentId: post._id },
    skip: !expanded && !!post.contents,
    fetchPolicy: "cache-first",
  });
  const expandedDocument = data?.post?.result ?? undefined;

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
}

export default registerComponent('PostsHighlight', PostsHighlight, {styles});
