import React, { MouseEvent, useLayoutEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import sortBy from 'lodash/sortBy';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { Link } from '../../lib/reactRouterWrapper';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import { useBookmark } from '../hooks/useBookmark';
import PortraitCoverImage from './PortraitCoverImage';
import ForumIcon from '../common/ForumIcon';
import LWTooltip from '../common/LWTooltip';
import Loading from '../vulcan-core/Loading';
import KeyboardArrowRightIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowRight';
import ExpandMoreIcon from '@/lib/vendor/@material-ui/icons/src/ExpandMore';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import ArrowForwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowForward';
import CheckIcon from '@/lib/vendor/@material-ui/icons/src/Check';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const LibrarySequenceExpansionQuery = gql(`
  query LibrarySequenceExpansion($sequenceId: String) {
    sequence(selector: { _id: $sequenceId }) {
      result {
        ...LibrarySequenceExpansionFragment
      }
    }
  }
`);

// The expansion has a fixed height: at most this many checklist rows, with
// longer sequences linking out ("n more posts") instead of growing the panel.
const MAX_CHECKLIST_ROWS = 6;
const DESCRIPTION_LINE_HEIGHT = 21;
const MIN_DESCRIPTION_LINES = 2;

// Shared with LibraryCollectionRow, which renders the same row/expansion
// layout for collections in the merged all-sequences list.
export const libraryRowStyles = defineStyles('LibrarySequenceRow', (theme: ThemeType) => ({
  row: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr auto 28px',
    gap: '12px',
    padding: '11px 16px',
    alignItems: 'center',
    cursor: 'pointer',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    '&:last-child': {
      borderBottom: 'none',
    },
    '&:hover': {
      background: theme.palette.background.hover,
    },
  },
  titleCell: {
    minWidth: 0,
  },
  title: {
    fontFamily: theme.typography.postStyle.fontFamily,
    ...theme.typography.smallCaps,
    fontSize: 16.9,
    fontWeight: 500,
    color: theme.palette.text.normal,
  },
  star: {
    fontSize: 14,
    color: theme.palette.text.dim,
    marginLeft: 5,
    verticalAlign: -1,
  },
  rowDescription: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '17px',
    color: theme.palette.text.secondary,
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rightMeta: {
    display: 'grid',
    gridTemplateColumns: '125px 110px',
    gap: '14px',
    alignItems: 'center',
    justifySelf: 'end',
    justifyItems: 'center',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  author: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    justifySelf: 'end',
    maxWidth: '100%',
  },
  topicPill: {
    display: 'inline-block',
    border: `1px solid ${theme.palette.greyAlpha(0.2)}`,
    borderRadius: 8,
    padding: '3px 10px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
  },
  chevron: {
    fontSize: 20,
    color: theme.palette.text.dim,
    justifySelf: 'center',
  },
  expandedWrapper: {
    borderBottom: theme.palette.border.faint,
  },
  expandedHeader: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr auto 28px',
    gap: '12px',
    padding: '11px 13px 6px 16px',
    alignItems: 'center',
    cursor: 'pointer',
  },
  // Matches the 54px cover height so the progress bar bottom-aligns with the
  // bottom edge of the cover image.
  expandedTitleCell: {
    minWidth: 0,
    height: 54,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  expandedTitle: {
    fontFamily: theme.typography.postStyle.fontFamily,
    ...theme.typography.smallCaps,
    fontSize: 19,
    fontWeight: 500,
    color: theme.palette.text.normal,
  },
  metaLine: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
    marginTop: 2,
  },
  progressTrack: {
    width: 394,
    maxWidth: '100%',
    height: 6,
    background: theme.palette.grey[300],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: theme.palette.primary.main,
  },
  progressCaptionRow: {
    padding: '0 24px 10px 68px',
  },
  progressCaption: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12.5,
    color: theme.palette.text.dim,
    cursor: 'default',
  },
  headerActions: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
  },
  save: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 6px',
    color: theme.palette.text.secondary,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  saveIcon: {
    fontSize: 17,
  },
  topicChip: {
    background: theme.palette.grey[200],
    borderRadius: 3,
    padding: '3px 8px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.normal,
    whiteSpace: 'nowrap',
  },
  body: {
    display: 'grid',
    gridTemplateColumns: '395px 1fr',
    gap: '8px 40px',
    padding: '8px 24px 20px 68px',
    alignItems: 'start',
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: '1fr',
    },
  },
  description: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: `${DESCRIPTION_LINE_HEIGHT}px`,
    color: theme.palette.text.secondary,
    margin: 0,
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
  chapterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '4px 0',
  },
  chapterCheckbox: {
    width: 10,
    height: 10,
    flex: 'none',
    border: `1px solid ${theme.palette.greyAlpha(0.2)}`,
    borderRadius: 2,
    background: theme.palette.panelBackground.default,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterCheckboxRead: {
    border: `1px solid ${theme.palette.primary.main}`,
    background: theme.palette.primary.main,
  },
  checkIcon: {
    fontSize: 9,
    color: theme.palette.text.alwaysWhite,
  },
  chapterLabel: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 15,
    color: theme.palette.text.normal,
  },
  chapterLabelRead: {
    color: theme.palette.text.secondary,
  },
  morePostsRow: {
    paddingTop: 8,
  },
  morePostsLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  morePostsIcon: {
    fontSize: 15,
  },
  bodyFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 14,
  },
  footerLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13.5,
    color: theme.palette.text.secondary,
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  linkIcon: {
    fontSize: 16,
  },
}));

interface LibraryChecklistRow {
  key: string;
  label: string;
  read: boolean;
}

// The expansion body's height is set by the chapter checklist (capped at
// MAX_CHECKLIST_ROWS); the description clamps to however many lines fit
// beside it, so long descriptions never make the expansion taller.
export const LibraryRowExpansionBody = ({description, rows, totalPostsCount, viewLink, viewLinkLabel}: {
  description: string | null,
  rows: LibraryChecklistRow[],
  totalPostsCount: number,
  viewLink: string,
  viewLinkLabel: string,
}) => {
  const classes = useStyles(libraryRowStyles);
  const chaptersColumnRef = useRef<HTMLDivElement | null>(null);
  const [descriptionClamp, setDescriptionClamp] = useState(MAX_CHECKLIST_ROWS);

  const shownRows = rows.slice(0, MAX_CHECKLIST_ROWS);
  const morePostsCount = Math.max(0, totalPostsCount - shownRows.length);

  useLayoutEffect(() => {
    const measure = () => {
      const height = chaptersColumnRef.current?.getBoundingClientRect().height ?? 0;
      if (height > 0) {
        setDescriptionClamp(Math.max(MIN_DESCRIPTION_LINES, Math.floor(height / DESCRIPTION_LINE_HEIGHT)));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [shownRows.length, morePostsCount]);

  return <div className={classes.body}>
    <div>
      {description && <p className={classes.description} style={{WebkitLineClamp: descriptionClamp}}>
        {description}
      </p>}
    </div>
    <div ref={chaptersColumnRef}>
      {shownRows.map(row => <div key={row.key} className={classes.chapterRow}>
        <span className={classNames(classes.chapterCheckbox, row.read && classes.chapterCheckboxRead)}>
          {row.read && <CheckIcon className={classes.checkIcon} />}
        </span>
        <span className={classNames(classes.chapterLabel, row.read && classes.chapterLabelRead)}>
          {row.label}
        </span>
      </div>)}
      {morePostsCount > 0 && <div className={classes.morePostsRow}>
        <Link to={viewLink} className={classes.morePostsLink}>
          {morePostsCount} more post{morePostsCount === 1 ? '' : 's'}
          <ArrowForwardIcon className={classes.morePostsIcon} />
        </Link>
      </div>}
      <div className={classes.bodyFooter}>
        <Link to={viewLink} className={classes.footerLink}>
          {viewLinkLabel}
          <ArrowForwardIcon className={classes.linkIcon} />
        </Link>
      </div>
    </div>
  </div>;
};

const LibrarySequenceRowBody = ({sequence}: {
  sequence: LibrarySequenceRowFragment,
}) => {
  const classes = useStyles(libraryRowStyles);
  const { data, loading } = useQuery(LibrarySequenceExpansionQuery, {
    variables: { sequenceId: sequence._id },
  });
  const expansion = data?.sequence?.result;

  if (loading || !expansion) {
    return <div className={classes.body}>
      <Loading />
    </div>;
  }

  const chapters = sortBy(expansion.chapters ?? [], ch => ch.number ?? 0);
  const titledChapters = chapters.filter(ch => ch.title);
  const allPosts = chapters.flatMap(ch => ch.posts ?? []).filter(post => !!post);

  // Sequences with titled chapters (e.g. Rationality: A-Z's books) show a
  // chapter checklist; the common single-untitled-chapter case falls back to
  // a checklist of the sequence's posts.
  const checklistRows = titledChapters.length > 0
    ? titledChapters.map(chapter => ({
        key: chapter._id,
        label: chapter.title ?? '',
        read: !!chapter.posts?.length && chapter.posts.every(post => post.isRead),
      }))
    : allPosts.map(post => ({
        key: post._id,
        label: post.title,
        read: !!post.isRead,
      }));

  return <LibraryRowExpansionBody
    description={sequence.contents?.plaintextDescription ?? null}
    rows={checklistRows}
    totalPostsCount={sequence.postsCount ?? 0}
    viewLink={sequenceGetPageUrl(sequence)}
    viewLinkLabel="View sequence"
  />;
};

const LibrarySequenceRow = ({sequence, expanded, onToggle}: {
  sequence: LibrarySequenceRowFragment,
  expanded: boolean,
  onToggle: () => void,
}) => {
  const classes = useStyles(libraryRowStyles);
  const { icon: bookmarkIcon, labelText: bookmarkLabel, toggleBookmark } = useBookmark(sequence._id, "Sequences");

  const handleHeaderKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  const handleSaveClick = (event: MouseEvent) => {
    event.stopPropagation();
    toggleBookmark(event);
  };

  const cover = <PortraitCoverImage
    coverImageId={sequence.coverImageId}
    gridImageId={sequence.gridImageId}
    bannerImageId={sequence.bannerImageId}
    title={sequence.title ?? ""}
    width={40}
    height={54}
  />;

  if (!expanded) {
    return <div
      className={classes.row}
      onClick={onToggle}
      onKeyDown={handleHeaderKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={false}
    >
      {cover}
      <div className={classes.titleCell}>
        <div className={classes.title}>
          {sequence.title}
          {sequence.curatedOrder != null && <StarIcon className={classes.star} />}
        </div>
        {sequence.contents?.plaintextDescription && <div className={classes.rowDescription}>
          {sequence.contents.plaintextDescription}
        </div>}
      </div>
      <span className={classes.rightMeta}>
        <span className={classes.author}>{sequence.user?.displayName}</span>
        <span>
          {sequence.libraryTopics.length > 0 && <span className={classes.topicPill}>{sequence.libraryTopics[0]}</span>}
        </span>
      </span>
      <KeyboardArrowRightIcon className={classes.chevron} />
    </div>;
  }

  const postsCount = sequence.postsCount ?? 0;
  const readPostsCount = sequence.readPostsCount ?? 0;
  const progressPercent = postsCount > 0 ? Math.round((readPostsCount / postsCount) * 100) : 0;

  return <div className={classes.expandedWrapper}>
    <div
      className={classes.expandedHeader}
      onClick={onToggle}
      onKeyDown={handleHeaderKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={true}
    >
      {cover}
      <div className={classes.expandedTitleCell}>
        <div>
          <div className={classes.expandedTitle}>{sequence.title}</div>
          <div className={classes.metaLine}>{sequence.user?.displayName}</div>
        </div>
        {postsCount > 0 && <div className={classes.progressTrack}>
          <div className={classes.progressFill} style={{width: `${progressPercent}%`}} />
        </div>}
      </div>
      <span className={classes.headerActions}>
        {sequence.libraryTopics.map(topic => <span key={topic} className={classes.topicChip}>{topic}</span>)}
        <span className={classes.save} onClick={handleSaveClick} title={bookmarkLabel}>
          <ForumIcon icon={bookmarkIcon} className={classes.saveIcon} />
        </span>
      </span>
      <ExpandMoreIcon className={classes.chevron} />
    </div>
    {postsCount > 0 && <div className={classes.progressCaptionRow}>
      <LWTooltip
        title={`${readPostsCount} / ${postsCount} read`}
        placement="bottom-start"
        distance={6}
      >
        <span className={classes.progressCaption}>{progressPercent}% read</span>
      </LWTooltip>
    </div>}
    <LibrarySequenceRowBody sequence={sequence} />
  </div>;
};

export default LibrarySequenceRow;
