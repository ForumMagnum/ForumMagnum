import React from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { getPingbackElementId } from '@/lib/pingback';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import PostsTooltip from '../../posts/PostsPreviewTooltip/PostsTooltip';
import { metaNoticeStyles } from './metaNoticeStyles';

const CommentPingbackContextQuery = gql(`
  query CommentPingbackContext($pingbackId: String) {
    pingback(selector: { _id: $pingbackId }) {
      result {
        _id
        targetPost {
          _id
          slug
          title
          isEvent
          groupId
        }
      }
    }
  }
`);

const styles = defineStyles("CommentPingbackContext", (theme: ThemeType) => ({
  root: {
    ...metaNoticeStyles(theme),
  },
}));

/**
 * For a reply to a pingback shown somewhere other than under the pingback,
 * which post's mention it replies to.
 */
const CommentPingbackContext = ({pingbackId}: {
  pingbackId: string,
}) => {
  const classes = useStyles(styles);
  const { data } = useQuery(CommentPingbackContextQuery, {
    variables: { pingbackId },
  });
  const targetPost = data?.pingback?.result?.targetPost;
  if (!targetPost) {
    return null;
  }

  return <div className={classes.root}>
    Reply to the mention of{" "}
    <PostsTooltip postId={targetPost._id} inlineBlock>
      <Link to={`${postGetPageUrl(targetPost)}#${getPingbackElementId(pingbackId)}`}>
        {targetPost.title}
      </Link>
    </PostsTooltip>
  </div>
}

export default CommentPingbackContext;
