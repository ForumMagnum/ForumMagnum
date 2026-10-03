'use client';

import React from 'react';
import type { QueueUser } from '../lib/types';

function accountAge(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));
  if (days < 1) return 'today';
  if (days < 30) return `${days}d old`;
  if (days < 365) return `${Math.floor(days / 30)}mo old`;
  return `${Math.floor(days / 365)}y old`;
}

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

const UserHeader = ({ user, subtitle }: { user: QueueUser; subtitle?: string }) => {
  return (
    <header className="user-header">
      <div className="user-header-main">
        <a className="user-name" href={user.profileUrl} target="_blank" rel="noreferrer">{user.displayName}</a>
        {user.sunshineFlagged && <span className="chip chip-flagged">Flagged</span>}
        {user.reviewGroup === 'offboard' && <span className="chip chip-offboard">Offboard candidate</span>}
      </div>
      <div className="user-header-stats">
        <span>{user.karma} karma</span>
        <span>{accountAge(user.createdAt)}</span>
        <span>{pluralize(user.postCount, 'post')}</span>
        <span>{pluralize(user.commentCount, 'comment')}</span>
        {subtitle && <span className="user-header-subtitle">{subtitle}</span>}
      </div>
    </header>
  );
};

export default UserHeader;
