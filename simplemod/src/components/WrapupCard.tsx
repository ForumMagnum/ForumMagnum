'use client';

import React from 'react';
import type { WrapupCardData } from '../lib/types';
import UserHeader from './UserHeader';

const WrapupCard = ({ card }: { card: WrapupCardData }) => {
  const { user } = card;
  return (
    <div className="card-body">
      <UserHeader user={user} />
      <div className="wrapup-message">
        <h2>Nothing left to review</h2>
        <p>
          All of this user&apos;s current content has been reviewed, rejected, or deleted, but they are
          still in the review queue.
        </p>
        <p className="wrapup-hint">
          Swipe right (or press <kbd>U</kbd>) to approve them as a user; swipe left (or press <kbd>S</kbd>)
          to remove them from the queue without approving — their future content will be reviewed again.
        </p>
      </div>
      {user.htmlBio && (
        <>
          <div className="section-label">Bio</div>
          <div className="content-html" dangerouslySetInnerHTML={{ __html: user.htmlBio }} />
        </>
      )}
      {user.sunshineNotes && (
        <>
          <div className="section-label">Moderator notes</div>
          <pre className="mod-notes">{user.sunshineNotes}</pre>
        </>
      )}
    </div>
  );
};

export default WrapupCard;
