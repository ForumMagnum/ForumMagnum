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

const UserHeader = ({ user, subtitle }: { user: QueueUser; subtitle?: string }) => {
  return (
    <header className="user-header">
      <div className="user-header-main">
        <span className="user-name">{user.displayName}</span>
        {user.sunshineFlagged && <span className="chip chip-flagged">Flagged</span>}
        {user.reviewGroup === 'offboard' && <span className="chip chip-offboard">Offboard candidate</span>}
      </div>
      <div className="user-header-stats">
        <span>{user.karma} karma</span>
        <span>{accountAge(user.createdAt)}</span>
        <span>{user.postCount} posts</span>
        <span>{user.commentCount} comments</span>
        {subtitle && <span className="user-header-subtitle">{subtitle}</span>}
      </div>
    </header>
  );
};

export default UserHeader;
