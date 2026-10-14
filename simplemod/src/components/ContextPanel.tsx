'use client';

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { fetchUserContext } from '../lib/api';
import type { QueueUser, UserContentItem } from '../lib/types';
import { formatPostedAt, PangramBadge } from './ContentCard';
import HighlightedHtml from './HighlightedHtml';

const statusLabels: Record<UserContentItem['status'], string> = {
  approved: 'Approved',
  unreviewed: 'Unreviewed',
  rejected: 'Rejected',
  draft: 'Draft',
};

const ContextHistoryItem = ({ item, isCurrent }: { item: UserContentItem; isCurrent: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={classNames('context-item', isCurrent && 'context-item-current')}>
      <button type="button" className="context-item-header" onClick={() => setExpanded(!expanded)}>
        <span className="context-item-title">
          {item.collectionName === 'Posts'
            ? (item.title ?? 'Untitled post')
            : `Comment on: ${item.postTitle ?? 'unknown post'}`}
        </span>
        <span className="context-item-meta">
          <span className={classNames('chip', `chip-status-${item.status}`)}>{statusLabels[item.status]}</span>
          {isCurrent && <span className="chip chip-current">Reviewing now</span>}
          <span>{formatPostedAt(item.postedAt)}</span>
          {item.baseScore !== null && <span>{item.baseScore} karma</span>}
          <PangramBadge pangramScore={item.pangramScore} aiChoice={item.aiChoice} />
        </span>
      </button>
      {expanded && (
        <HighlightedHtml
          className="content-html context-item-body"
          html={item.html}
          windowScores={item.pangramWindowScores}
        />
      )}
    </div>
  );
};

const ContextPanel = ({ user, currentDocumentId, onClose }: {
  user: QueueUser;
  currentDocumentId: string | null;
  onClose: () => void;
}) => {
  const [items, setItems] = useState<UserContentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    fetchUserContext(user._id)
      .then(response => {
        if (!cancelled) setItems(response.items);
      })
      .catch(fetchError => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
      });
    return () => { cancelled = true; };
  }, [user._id]);

  return (
    <aside className="context-panel">
      <div className="context-panel-header">
        <span className="context-panel-title">{user.displayName}</span>
        <button type="button" className="context-panel-close" onClick={onClose} aria-label="Close context panel">
          ✕
        </button>
      </div>
      {user.htmlBio && (
        <>
          <div className="section-label">Bio</div>
          <div className="content-html context-bio" dangerouslySetInnerHTML={{ __html: user.htmlBio }} />
        </>
      )}
      {user.sunshineNotes && (
        <>
          <div className="section-label">Moderator notes</div>
          <pre className="mod-notes">{user.sunshineNotes}</pre>
        </>
      )}
      <div className="section-label">
        {items ? `All content (${items.length})` : 'All content'}
      </div>
      {error && <div className="context-panel-error">{error}</div>}
      {!items && !error && <div className="context-panel-loading">Loading…</div>}
      {items && items.length === 0 && <div className="context-panel-loading">No posts or comments.</div>}
      {items?.map(item => (
        <ContextHistoryItem
          key={`${item.collectionName}-${item.documentId}`}
          item={item}
          isCurrent={item.documentId === currentDocumentId}
        />
      ))}
    </aside>
  );
};

export default ContextPanel;
