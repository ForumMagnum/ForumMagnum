'use client';

import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { truncate } from '@/lib/editor/ellipsize';

const styles = defineStyles('ModerationUserBioColumn', (theme: ThemeType) => ({
  column: {
    flex: 1,
    minWidth: 0,
    // Fill the space left over by the sections above, but when they crowd
    // the column, keep at least enough room for a few lines of bio.
    minHeight: 140,
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
  },
  headerBio: {
    fontSize: 13,
    lineHeight: 1.6,
    color: theme.palette.grey[700],
    ...theme.typography.commentStyle,
    '& a': {
      color: theme.palette.primary.main,
    },
    '& img': {
      maxWidth: '100%',
    },
    // Grow to the bio's natural height, but shrink (and scroll) when the
    // column runs out of vertical space rather than overflowing it.
    overflow: 'auto',
    minHeight: 0,
  },
  headerWebsite: {
    fontSize: 13,
    color: theme.palette.primary.main,
    display: 'block',
  },
  expandButton: {
    cursor: 'pointer',
    fontSize: 13,
    color: theme.palette.primary.main,
    marginTop: 8,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

const DEFAULT_BIO_WORDCOUNT = 250;
const MAX_BIO_WORDCOUNT = 10000;

const ModerationUserBioColumn = ({
  user,
}: {
  user: SunshineUsersList;
}) => {
  const classes = useStyles(styles);
  const [bioWordcount, setBioWordcount] = useState(DEFAULT_BIO_WORDCOUNT);

  const truncatedHtml = truncate(user.htmlBio, bioWordcount, 'words');
  const bioNeedsTruncation = user.htmlBio && user.htmlBio.length > truncatedHtml.length;

  if (!user.htmlBio && !user.website) {
    return null;
  }

  return (
    <div className={classes.column}>
      <div className={classes.sectionTitle}>Bio</div>
      {user.htmlBio && (
        <>
          <div
            className={classes.headerBio}
            dangerouslySetInnerHTML={{ __html: truncatedHtml }}
            onClick={() => bioNeedsTruncation && setBioWordcount(MAX_BIO_WORDCOUNT)}
          />
          {bioNeedsTruncation && bioWordcount < MAX_BIO_WORDCOUNT && (
            <div
              className={classes.expandButton}
              onClick={() => setBioWordcount(MAX_BIO_WORDCOUNT)}
            >
              Show more
            </div>
          )}
        </>
      )}
      {user.website && (
        <a
          href={`https://${user.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className={classes.headerWebsite}
        >
          {user.website}
        </a>
      )}
    </div>
  );
};

export default ModerationUserBioColumn;
