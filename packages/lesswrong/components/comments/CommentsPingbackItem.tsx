import React from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { nofollowKarmaThreshold } from '@/lib/instanceSettings';
import { pingbackExcerptLinkClass } from '@/lib/pingback';
import { getDefaultVotingSystem } from '@/lib/voting/getVotingSystem';
import { useForumType } from '@/components/hooks/useForumType';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useVote } from '../votes/withVote';
import OverallVoteAxis from '../votes/OverallVoteAxis';
import PostsTooltip from '../posts/PostsPreviewTooltip/PostsTooltip';
import UsersName from '../users/UsersName';
import FormatDate from '../common/FormatDate';
import ContentStyles from '../common/ContentStyles';
import { ContentItemBody } from '../contents/ContentItemBody';
import CommentFrame from './CommentFrame';
import type { CommentTreeOptions } from './commentTree';
import type { PingbackWithSourcePost } from './interleavePingbacks';

const styles = defineStyles("CommentsPingbackItem", (theme: ThemeType) => ({
  root: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 8,
    ...theme.typography.commentStyle,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 6,
    rowGap: 6,
    paddingTop: "0.6em",
    marginBottom: 8,
    color: theme.palette.text.dim,
  },
  postTitle: {
    fontWeight: 600,
    color: theme.palette.text.normal,
  },
  excerpt: {
    maxWidth: "100%",
    overflowX: "hidden",
    [`& .${pingbackExcerptLinkClass}`]: {
      backgroundColor: theme.palette.editor.commentMarker,
    },
  },
}));

const CommentsPingbackItem = ({pingback, treeOptions}: {
  pingback: PingbackWithSourcePost,
  treeOptions: CommentTreeOptions,
}) => {
  const classes = useStyles(styles);
  const { forumType } = useForumType();
  const voteProps = useVote(pingback, "Pingbacks", getDefaultVotingSystem());
  const { sourcePost } = pingback;

  return <AnalyticsContext pageElementContext="pingbackItem" collectionName="Pingbacks" documentId={pingback._id}>
    <CommentFrame treeOptions={treeOptions} nestingLevel={1} id={`pingback-${pingback._id}`}>
      <div className={classes.root}>
        <div className={classes.meta}>
          <span>Mentioned in</span>
          <PostsTooltip postId={sourcePost._id} inlineBlock>
            <Link className={classes.postTitle} to={postGetPageUrl(sourcePost)}>
              {sourcePost.title}
            </Link>
          </PostsTooltip>
          <span>by</span>
          <UsersName user={sourcePost.user} />
          <FormatDate date={sourcePost.postedAt} />
          <OverallVoteAxis document={pingback} voteProps={voteProps} />
        </div>
        <ContentStyles contentType="comment">
          <ContentItemBody
            className={classes.excerpt}
            dangerouslySetInnerHTML={{__html: pingback.excerpt}}
            description={`pingback ${pingback._id}`}
            nofollow={(sourcePost.user?.karma ?? 0) < nofollowKarmaThreshold.get(forumType)}
          />
        </ContentStyles>
      </div>
    </CommentFrame>
  </AnalyticsContext>
}

export default CommentsPingbackItem;
