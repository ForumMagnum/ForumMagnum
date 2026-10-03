'use client';

import React, { useState } from 'react';
import type { ContentCardData } from '../lib/types';
import UserHeader from './UserHeader';
import HighlightedHtml from './HighlightedHtml';

export type CheckState = 'running' | 'failed' | null;

export function formatPostedAt(postedAt: string): string {
  const date = new Date(postedAt);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

// Same color curve as highlightHtmlWithPangramWindowScores' scoreToColour, so
// the chip and the passage highlighting read on one scale.
function pangramChipColor(score: number): string {
  const adjustedRatio = Math.pow(Math.max(0, Math.min(1, score)), 0.7);
  const hue = 120 - adjustedRatio * 120;
  return `light-dark(hsl(${hue}, 100%, 85%), hsl(${hue}, 55%, 25%))`;
}

export const PangramBadge = ({ pangramScore, aiChoice, pangramPrediction }: {
  pangramScore: number | null;
  aiChoice: string | null;
  pangramPrediction?: string | null;
}) => {
  if (pangramScore === null && !aiChoice) {
    return null;
  }
  return (
    <>
      {pangramScore !== null && (
        <span
          className="chip chip-pangram"
          style={{ background: pangramChipColor(pangramScore) }}
          title="Pangram AI-detection score. Passage highlighting uses the same green-to-red scale: more red = more likely AI-written."
        >
          Pangram {Math.round(pangramScore * 100)}%{pangramPrediction ? ` · ${pangramPrediction}` : ''}
        </span>
      )}
      {aiChoice && <span className="chip" title="Automated LLM triage verdict">Auto-triage: {aiChoice}</span>}
    </>
  );
};

const ParentCommentContext = ({ author, html }: { author: string | null; html: string }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="parent-comment">
      <button type="button" className="parent-comment-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▾' : '▸'} Replying to {author ?? 'unknown user'}
      </button>
      {expanded && (
        <div className="content-html parent-comment-body" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
};

const ContentCard = ({ card, checkState = null, onRetryCheck }: {
  card: ContentCardData;
  checkState?: CheckState;
  onRetryCheck?: () => void;
}) => {
  const { user, item, remainingCount } = card;
  const positionLabel = remainingCount > 1 ? `${remainingCount} unreviewed from this user` : 'last unreviewed item';
  return (
    <div className="card-body">
      <UserHeader user={user} subtitle={positionLabel} />
      <div className="content-meta">
        <span className="chip">{item.collectionName === 'Posts' ? 'Post' : 'Comment'}</span>
        <span>{formatPostedAt(item.postedAt)}</span>
        {item.baseScore !== null && <span>{item.baseScore} karma</span>}
        <PangramBadge pangramScore={item.pangramScore} aiChoice={item.aiChoice} pangramPrediction={item.pangramPrediction} />
        {checkState === 'running' && <span className="check-indicator">running AI check…</span>}
        {checkState === 'failed' && item.pangramScore === null && (
          <button type="button" className="check-indicator check-retry" onClick={onRetryCheck}>
            AI check unavailable — retry
          </button>
        )}
        <a className="external-link" href={item.itemUrl} target="_blank" rel="noreferrer">open on site ↗</a>
      </div>
      {item.collectionName === 'Posts' ? (
        <h2 className="content-title">{item.title}</h2>
      ) : (
        <>
          {item.postTitle && <div className="content-context">Comment on: {item.postTitle}</div>}
          {item.parentCommentHtml && (
            <ParentCommentContext author={item.parentCommentAuthor} html={item.parentCommentHtml} />
          )}
        </>
      )}
      <HighlightedHtml className="content-html content-html-reading" html={item.html} windowScores={item.pangramWindowScores} />
    </div>
  );
};

export default ContentCard;
