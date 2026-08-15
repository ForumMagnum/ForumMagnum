'use client';

import React from 'react';
import classNames from 'classnames';
import type { OffboardCardData } from '../lib/types';
import UserHeader from './UserHeader';
import { formatPostedAt, PangramBadge } from './ContentCard';

export interface OffboardSelection {
  selectedIds: string[];
  removePermissions: boolean;
}

const OffboardCard = ({ card, selection, onChangeSelection }: {
  card: OffboardCardData;
  selection: OffboardSelection;
  onChangeSelection: (selection: OffboardSelection) => void;
}) => {
  const { user, items, rejectedPostCount, rejectedCommentCount } = card;
  const rejectedSummary = [
    rejectedPostCount > 0 ? `${rejectedPostCount} rejected post${rejectedPostCount === 1 ? '' : 's'}` : null,
    rejectedCommentCount > 0 ? `${rejectedCommentCount} rejected comment${rejectedCommentCount === 1 ? '' : 's'}` : null,
  ].filter(Boolean).join(', ');

  const toggleItem = (documentId: string) => {
    const selected = new Set(selection.selectedIds);
    if (selected.has(documentId)) {
      selected.delete(documentId);
    } else {
      selected.add(documentId);
    }
    onChangeSelection({ ...selection, selectedIds: [...selected] });
  };

  return (
    <div className="card-body">
      <UserHeader user={user} subtitle={rejectedSummary || undefined} />
      {user.karma < 0 && <div className="offboard-reason">Negative karma ({user.karma})</div>}
      {user.htmlBio && (
        <>
          <div className="section-label">Bio</div>
          <div className="content-html content-html-compact" dangerouslySetInnerHTML={{ __html: user.htmlBio }} />
        </>
      )}
      <div className="section-label">
        {items.length > 0
          ? `Remaining unreviewed content — check items to reject on offboard (${selection.selectedIds.length}/${items.length} selected)`
          : 'No unreviewed content remaining'}
      </div>
      <div className="offboard-items">
        {items.map(item => (
          <label key={item.documentId} className={classNames('offboard-item', selection.selectedIds.includes(item.documentId) && 'offboard-item-selected')}>
            <input
              type="checkbox"
              checked={selection.selectedIds.includes(item.documentId)}
              onChange={() => toggleItem(item.documentId)}
            />
            <span className="offboard-item-info">
              <span className="offboard-item-title">
                {item.collectionName === 'Posts' ? (item.title ?? 'Untitled post') : `Comment on: ${item.postTitle ?? 'unknown post'}`}
              </span>
              <span className="offboard-item-meta">
                {formatPostedAt(item.postedAt)}
                <PangramBadge pangramScore={item.pangramScore} aiChoice={item.aiChoice} />
              </span>
              {item.html && <span className="offboard-item-excerpt" dangerouslySetInnerHTML={{ __html: item.html }} />}
            </span>
          </label>
        ))}
      </div>
      <label className="offboard-permissions-toggle">
        <input
          type="checkbox"
          checked={selection.removePermissions}
          onChange={event => onChangeSelection({ ...selection, removePermissions: event.target.checked })}
        />
        Disable posting, commenting, and messaging on offboard
      </label>
      {user.sunshineNotes && (
        <>
          <div className="section-label">Moderator notes</div>
          <pre className="mod-notes">{user.sunshineNotes}</pre>
        </>
      )}
    </div>
  );
};

export default OffboardCard;
