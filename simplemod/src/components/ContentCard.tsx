'use client';

import React from 'react';
import type { ContentCardData } from '../lib/types';
import UserHeader from './UserHeader';

export function formatPostedAt(postedAt: string): string {
  return new Date(postedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export const PangramBadge = ({ pangramScore, aiChoice }: { pangramScore: number | null; aiChoice: string | null }) => {
  if (pangramScore === null && !aiChoice) {
    return null;
  }
  const highScore = pangramScore !== null && pangramScore > 0.5;
  return (
    <span className={highScore ? 'chip chip-ai-high' : 'chip'}>
      {pangramScore !== null ? `Pangram ${Math.round(pangramScore * 100)}%` : null}
      {pangramScore !== null && aiChoice ? ' · ' : null}
      {aiChoice ? `LLM: ${aiChoice}` : null}
    </span>
  );
};

const ContentCard = ({ card }: { card: ContentCardData }) => {
  const { user, item, remainingCount } = card;
  const positionLabel = remainingCount > 1 ? `1 of ${remainingCount} unreviewed` : 'last unreviewed item';
  return (
    <div className="card-body">
      <UserHeader user={user} subtitle={positionLabel} />
      <div className="content-meta">
        <span className="chip">{item.collectionName === 'Posts' ? 'Post' : 'Comment'}</span>
        <span>{formatPostedAt(item.postedAt)}</span>
        {item.baseScore !== null && <span>{item.baseScore} karma</span>}
        <PangramBadge pangramScore={item.pangramScore} aiChoice={item.aiChoice} />
      </div>
      {item.collectionName === 'Posts' ? (
        <h2 className="content-title">{item.title}</h2>
      ) : (
        item.postTitle && <div className="content-context">Comment on: {item.postTitle}</div>
      )}
      <div className="content-html" dangerouslySetInnerHTML={{ __html: item.html ?? '<p><em>(no content)</em></p>' }} />
    </div>
  );
};

export default ContentCard;
