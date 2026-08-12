'use client';

import React from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { formatSuggestionSummary } from '../editor/lexicalPlugins/suggestedEdits/suggestionSummaryUtils';
import { type Thread } from '../lexical/commenting';
import { useProjectCommentThreads } from './useProjectCommentThreads';
import { researchWarmAlpha } from './researchStyleUtils';

const ProjectCommentsDocumentsQuery = gql(`
  query ProjectCommentsDocumentsQuery($projectId: String!) {
    researchDocuments(selector: { byProject: { projectId: $projectId } }, limit: 200) {
      results { _id title }
    }
  }
`);

const styles = defineStyles('ProjectCommentsList', (theme: ThemeType) => ({
  root: {
    flex: 'none',
    maxHeight: '45%',
    overflowY: 'auto',
    borderTop: theme.palette.greyBorder('1px', 0.08),
  },
  // With no active document there's no panel above — this list is the whole
  // tab body.
  fullHeight: {
    flex: 1,
    maxHeight: 'none',
    borderTop: 'none',
  },
  sectionHeading: {
    padding: '10px 14px 4px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: researchWarmAlpha(0.5),
  },
  documentGroup: {
    padding: '6px 0',
    cursor: 'pointer',
    '&:hover': {
      background: researchWarmAlpha(0.04),
    },
    '& + &': {
      borderTop: theme.palette.greyBorder('1px', 0.08),
    },
  },
  documentTitle: {
    padding: '2px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  thread: {
    padding: '4px 14px',
  },
  quote: {
    fontSize: 12,
    color: researchWarmAlpha(0.55),
    borderLeft: theme.palette.greyBorder('2px', 0.15),
    paddingLeft: 8,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  threadText: {
    fontSize: 13,
    color: theme.palette.text.primary,
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
  },
  threadMeta: {
    fontSize: 11,
    color: researchWarmAlpha(0.5),
  },
  empty: {
    padding: '16px 14px',
    fontSize: 13,
    color: theme.palette.text.dim,
  },
}));

function isOpenThread(thread: Thread): boolean {
  return (thread.status ?? 'open') === 'open';
}

/**
 * Deleting a comment replaces it with a `deleted: true` placeholder rather
 * than removing the thread, so a thread can be all-placeholders while still
 * "open" — nothing worth listing.
 */
function hasVisibleComments(thread: Thread): boolean {
  return thread.comments.some((comment) => !comment.deleted);
}

/** The thread's first visible comment, rendered as a one-line summary. */
function threadPreviewText(thread: Thread): string {
  const firstComment = thread.comments.find((comment) => !comment.deleted);
  if (!firstComment) return '';
  if (firstComment.commentKind === 'suggestionSummary') {
    return formatSuggestionSummary(firstComment.content);
  }
  return firstComment.content;
}

/**
 * Project-wide comment/suggestion overview for the research workspace's
 * Comments tab: live thread lists for every document in the project (the
 * active document is excluded — its threads render in the docked panel
 * above). Clicking a document's group navigates to it.
 */
const ProjectCommentsList = ({ projectId, activeDocumentId, onSelectDocument }: {
  projectId: string;
  activeDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
}) => {
  const classes = useStyles(styles);

  const { data, loading } = useQuery(ProjectCommentsDocumentsQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });
  const documents = data?.researchDocuments?.results ?? [];

  // The active document's threads render in the docked panel, which holds
  // its own live connection — no need to subscribe to it here too.
  const threadsByDocument = useProjectCommentThreads(
    documents.filter((doc) => doc._id !== activeDocumentId).map((doc) => doc._id),
  );

  const groups = documents
    .filter((doc) => doc._id !== activeDocumentId)
    .map((doc) => ({
      document: doc,
      openThreads: (threadsByDocument.get(doc._id) ?? [])
        .filter((thread) => isOpenThread(thread) && hasVisibleComments(thread)),
    }))
    .filter((group) => group.openThreads.length > 0);

  const rootClassName = classNames(classes.root, !activeDocumentId && classes.fullHeight);

  if (groups.length === 0) {
    if (activeDocumentId || (loading && !data)) {
      return null;
    }
    return <div className={rootClassName}>
      <div className={classes.empty}>No comments in this project yet.</div>
    </div>;
  }

  return (
    <div className={rootClassName}>
      <div className={classes.sectionHeading}>
        {activeDocumentId ? 'Other documents' : 'All documents'}
      </div>
      {groups.map(({ document, openThreads }) => (
        <div
          key={document._id}
          className={classes.documentGroup}
          onClick={() => onSelectDocument(document._id)}
        >
          <div className={classes.documentTitle}>
            {document.title ?? 'Untitled document'}
          </div>
          {openThreads.map((thread) => {
            const replyCount = thread.comments.filter((comment) => !comment.deleted).length - 1;
            return (
              <div key={thread.id} className={classes.thread}>
                {thread.quote && <div className={classes.quote}>{thread.quote}</div>}
                <div className={classes.threadText}>{threadPreviewText(thread)}</div>
                {replyCount > 0 && (
                  <div className={classes.threadMeta}>
                    {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ProjectCommentsList;
