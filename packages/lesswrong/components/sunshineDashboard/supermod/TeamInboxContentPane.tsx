import React, { useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Loading from '@/components/vulcan-core/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';
import ModerationContentDetail from './ModerationContentDetail';
import { isPost, type ContentItem } from './helpers';
import type { TeamInboxThread } from './teamInboxThreads';

const TeamInboxRejectedContentQuery = gql(`
  query TeamInboxRejectedContent($conversationId: String!) {
    conversation(selector: { _id: $conversationId }) {
      result {
        _id
        rejectedPosts {
          ...SunshinePostsList
        }
        rejectedComments {
          ...SunshineCommentsList
        }
      }
    }
  }
`);

const styles = defineStyles('TeamInboxContentPane', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: theme.palette.background.paper,
  },
  header: {
    ...theme.typography.commentStyle,
    padding: '12px 16px',
    borderBottom: theme.palette.border.normal,
    flexShrink: 0,
    fontSize: 14,
  },
  selector: {
    ...theme.typography.commentStyle,
    display: 'block',
    width: '100%',
    marginTop: 8,
    padding: 6,
    color: theme.palette.text.normal,
    backgroundColor: theme.palette.background.paper,
    border: theme.palette.border.normal,
  },
  notice: {
    ...theme.typography.commentStyle,
    padding: 24,
    color: theme.palette.text.dim,
    fontSize: 14,
  },
}));

function getContentLabel(item: ContentItem): string {
  return isPost(item) ? `Post: ${item.title}` : `Comment on ${item.post?.title ?? 'unknown post'}`;
}

const TeamInboxContentPane = ({ thread }: { thread: TeamInboxThread | null }) => {
  const classes = useStyles(styles);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useQuery(TeamInboxRejectedContentQuery, {
    variables: { conversationId: thread?.conversation._id ?? '' },
    skip: !thread,
    ssr: false,
    fetchPolicy: 'cache-and-network',
  });
  const conversation = data?.conversation?.result;
  const items: ContentItem[] = [...(conversation?.rejectedPosts ?? []), ...(conversation?.rejectedComments ?? [])];
  const appealedItem = thread?.appeal?.post ?? thread?.appeal?.comment;
  // An appeal is already loaded with the inbox; display it while related content loads.
  if (appealedItem && !items.some(item => item._id === appealedItem._id)) items.unshift(appealedItem);
  const selectedItem = items.find(item => item._id === selectedId)
    ?? items.find(item => item._id === appealedItem?._id)
    ?? items[0];

  return <section className={classes.root} aria-label="Rejected content">
    <div className={classes.header}>
      Rejected content
      {items.length > 1 && <select
        className={classes.selector}
        aria-label="Select rejected content"
        value={selectedItem?._id ?? ''}
        onChange={event => setSelectedId(event.target.value)}
      >
        {items.map(item => <option key={item._id} value={item._id}>{getContentLabel(item)}</option>)}
      </select>}
    </div>
    {error && <div className={classes.notice}>
      <ErrorMessage message="Unable to load rejected content." />
      <Button onClick={() => { void refetch().catch(() => {}); }}>Retry</Button>
    </div>}
    {selectedItem
      ? <ModerationContentDetail key={selectedItem._id} item={selectedItem} />
      : loading ? <Loading />
        : !error && <div className={classes.notice}>
          {thread ? 'No rejected content is linked to this conversation.' : 'Select a conversation to view its rejected content.'}
        </div>}
  </section>;
};

export default TeamInboxContentPane;
