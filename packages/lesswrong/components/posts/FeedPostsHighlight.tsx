import { registerComponent } from '../../lib/vulcan-lib/components';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import React, { FC, useState, useCallback, useEffect } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useSingle } from '../../lib/crud/withSingle';
import { nofollowKarmaThreshold } from '../../lib/publicSettings';
import classNames from 'classnames';
import { useRecordPostView } from '../hooks/useRecordPostView';
import { useTracking } from '../../lib/analyticsEvents';
import { truncateWithGrace } from '../../lib/editor/ellipsize';
import ContentStyles from "../common/ContentStyles";
import ContentItemBody from "../common/ContentItemBody";
import Loading from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  root: {
    '& .read-more-button': {
      opacity: 0.7,
    }
  },
  expandedTextBody: {
    marginBottom: 10,
  },
  highlightContinue: {
    marginTop: theme.spacing.unit*2,
    fontFamily: theme.palette.fonts.sansSerifStack,
    '&& a, && a:hover': {
      color: theme.palette.primary.main,
    },
  },
  maxHeight: {
    maxHeight: 600,
    overflow: "hidden",
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
  classes: ClassesType<typeof styles>,
}) => {
  const { htmlHighlight = "", wordCount = 0 } = post.contents ?? {};

  const { recordPostView } = useRecordPostView(post); 
  const { captureEvent } = useTracking();

  const clickExpand = useCallback((ev: MouseEvent) => {
    setExpanded(true);
    ev.preventDefault();
    void recordPostView({post, extraEventProperties: {type: 'expandPostCard'}});
    captureEvent('readMoreClicked', {postId: post._id});
  }, [setExpanded, recordPostView, post, captureEvent]);


  const maxLengthWords = expanded ? 1000 : maxCollapsedLengthWords;

  const html = expandedDocument?.contents?.html ?? htmlHighlight
  const rawWordCount = wordCount ?? 0;
  const readMoreId = `feed-post-read-more-${post._id}`;

  const styles = html.match(/<style[\s\S]*?<\/style>/g) ?? ""
  const suffix = expanded ? undefined : `... <span id="${readMoreId}" class="read-more-button">(read more)</span>${styles}`

  useEffect(() => {
    const readMoreButton = document.getElementById(readMoreId);
    readMoreButton?.addEventListener('click', clickExpand);
    return () => {
      readMoreButton?.removeEventListener('click', clickExpand);
    } 
  }, [readMoreId, clickExpand]);

  const {truncatedHtml, wasTruncated, wordsLeft} =  truncateWithGrace(html, maxLengthWords, 20, rawWordCount, suffix);

  return <ContentStyles contentType="postHighlight" className={classes.root}>
    <ContentItemBody
      dangerouslySetInnerHTML={{__html: truncatedHtml}}
      description={`post ${post._id}`}
      nofollow={(post.user?.karma || 0) < nofollowKarmaThreshold.get()}
      className={classNames({[classes.expandedTextBody]: expanded, [classes.maxHeight]: !expanded})}
    />
    {expanded && wasTruncated && <TruncatedSuffix
      post={post}
      wordsLeft={wordsLeft}
    />}
    {expandedLoading && expanded && <Loading/>}
  </ContentStyles>
}

const FeedPostsHighlight = ({post, ...rest}: {
  post: PostsList,
  maxCollapsedLengthWords: number,
  initiallyExpanded?: boolean,
  forceSeeMore?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { document: expandedDocument, loading: expandedLoading } = useSingle({
    documentId: post._id,
    skip: !expanded && !!post.contents,
    ...expandedFetchProps,
  });

  return (
    <FeedPostHighlightBody {...{
      post,
      expanded,
      setExpanded,
      expandedLoading,
      expandedDocument,
      ...rest
    }}/>
  );
}

export default registerComponent('FeedPostsHighlight', FeedPostsHighlight, {styles});
