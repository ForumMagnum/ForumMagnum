import React, { MouseEvent, useLayoutEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import sortBy from 'lodash/sortBy';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import { useBookmark } from '../hooks/useBookmark';
import { useItemsRead } from '../hooks/useRecordPostView';
import { useMutation } from '@apollo/client/react';
import { isCoreLibraryTag } from '../../lib/collections/sequences/libraryTopics';
import PortraitCoverImage from './PortraitCoverImage';
import BookmarkButton from '../posts/BookmarkButton';
import PostsTooltip from '../posts/PostsPreviewTooltip/PostsTooltip';
import UsersName from '../users/UsersName';
import ForumIcon from '../common/ForumIcon';
import HoverOver from '../common/HoverOver';
import LWTooltip from '../common/LWTooltip';
import Loading from '../vulcan-core/Loading';
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

const LibraryRowMarkAsReadMutation = gql(`
  mutation libraryRowMarkAsReadOrUnread($postId: String, $isRead: Boolean) {
    markAsReadOrUnread(postId: $postId, isRead: $isRead)
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
    gridTemplateColumns: '40px 1fr auto',
    gap: '12px',
    padding: '11px 16px',
    alignItems: 'center',
    cursor: 'pointer',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    '&:last-child': {
      borderBottom: 'none',
    },
    // Same light-grey hover as the homepage post list (LWPostsItem).
    '&:hover': {
      background: theme.palette.panelBackground.postsItemHover,
      ...(theme.dark && {
        background: theme.palette.panelBackground.bannerAdTranslucentHeavy,
      }),
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
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
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
  expandedWrapper: {
    borderBottom: theme.palette.border.faint,
  },
  expandedHeader: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr auto',
    gap: '12px',
    // Identical to the collapsed row so nothing shifts on expansion.
    padding: '11px 16px',
    alignItems: 'center',
  },
  // Tag chips with the [-] collapse toggle underneath, aligned to the
  // chips' right edge.
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    justifySelf: 'end',
  },
  // Mimics the comment meta [-] collapse control; the only way to collapse
  // an expanded row.
  collapseToggle: {
    opacity: 0.8,
    fontSize: '0.8rem',
    lineHeight: '1rem',
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '& span': {
      fontFamily: 'monospace',
    },
    '&:hover': {
      opacity: 1,
    },
  },
  // Same 17px line as rowDescription: swapping description for the progress
  // caption on expansion must not move the title.
  metaLine: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '17px',
    color: theme.palette.text.dim,
    marginTop: 2,
  },
  // Inline beside the "% read" caption so it adds no vertical height.
  progressTrack: {
    display: 'inline-block',
    width: 140,
    maxWidth: '100%',
    height: 5,
    background: theme.palette.grey[300],
    borderRadius: 2,
    overflow: 'hidden',
    verticalAlign: 'middle',
    marginLeft: 10,
  },
  progressFill: {
    display: 'block',
    height: '100%',
    background: theme.palette.primary.main,
  },
  progressCaption: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12.5,
    color: theme.palette.text.dim,
    cursor: 'default',
  },
  // Collapsed-row tag cell: right-aligned in its column (rather than
  // centered) so the chips share one flush right edge across all rows;
  // stacks vertically when a row shows two core tags.
  pillCell: {
    justifySelf: 'end',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '3px',
  },
  // All of an expanded row's tags, inline on one row (quick-takes-style
  // expansion: the header swaps to a fuller layout rather than preserving
  // the collapsed row's geometry).
  headerTags: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 320,
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  save: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    // The padding enlarges the click target; the negative margin cancels it
    // out of the footer line's layout so the icon centers on the link text.
    padding: 4,
    margin: -4,
    color: theme.palette.icon.dim3,
    cursor: 'pointer',
  },
  saveIcon: {
    // Default ForumIcon size, matching the post-preview tooltip's bookmark.
    fontSize: 24,
  },
  topicChip: {
    background: theme.palette.grey[200],
    borderRadius: 3,
    padding: '3px 8px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.grey[600],
    whiteSpace: 'nowrap',
  },
  // Core tags (incl. Fiction) render white; specific topic labels stay grey.
  coreTagChip: {
    background: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.greyAlpha(0.2)}`,
    padding: '2px 7px',
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
  // Continuation link under the expanded description when the clamp cuts it
  // short, styled like the "(read n more words →)" link on truncated posts.
  // Same font/size as the description; no hover color change.
  readFullDescription: {
    display: 'inline-block',
    marginTop: 4,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: `${DESCRIPTION_LINE_HEIGHT}px`,
    color: theme.palette.grey[600],
  },
  // Hover preview styled like the homepage post-preview card: title +
  // bookmark, author, body text, "(read more)".
  descriptionHoverCard: {
    width: 400,
    maxWidth: '90vw',
    background: theme.palette.panelBackground.default,
    boxShadow: theme.palette.boxShadow.lwCard,
    borderRadius: 3,
    padding: '14px 16px',
  },
  hoverCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  hoverCardTitle: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 18,
    fontWeight: 500,
    color: theme.palette.text.normal,
    '&:hover': {
      opacity: .85,
    },
  },
  hoverCardAuthor: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontStyle: 'italic',
    fontSize: 14,
    color: theme.palette.grey[600],
    marginTop: 2,
  },
  hoverCardDescription: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 15,
    lineHeight: '22px',
    color: theme.palette.text.normal,
    marginTop: 10,
    display: '-webkit-box',
    '-webkit-line-clamp': 12,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
  hoverCardReadMore: {
    display: 'inline-block',
    marginTop: 4,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 14,
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  // The description links to the sequence but must not read as a link: no
  // color/opacity shift on hover.
  descriptionLink: {
    color: 'inherit',
    '&:hover': {
      color: 'inherit',
      opacity: 1,
    },
  },
  description: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: `${DESCRIPTION_LINE_HEIGHT}px`,
    color: theme.palette.text.secondary,
    margin: 0,
    '&:hover': {
      color: theme.palette.text.secondary,
    },
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
  chapterCheckboxClickable: {
    cursor: 'pointer',
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
  bodyFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '14px',
    marginTop: 14,
    // Let the bookmark hang slightly outside the body's right padding, into
    // the expansion's bottom-right corner.
    marginRight: -8,
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

interface LibraryRowHoverCardProps {
  title: string,
  authorName: string | null,
  description: string,
  url: string,
  documentId: string,
  collectionName: 'Sequences' | 'Collections',
  isBookmarked: boolean,
}

// Post-preview-style hover card (title, author, save button, description,
// read-more). Shown for collapsed row descriptions and the recommended-zone
// boxes on the library page.
export const LibraryRowHoverCard = ({title, authorName, description, url, documentId, collectionName, isBookmarked}: LibraryRowHoverCardProps) => {
  const classes = useStyles(libraryRowStyles);

  // The popper is portaled, but clicks inside it still bubble up the React
  // tree to the anchor's click handler (eg a collapsed row's expand toggle,
  // or a recommended card's link); links in the card should navigate, not
  // trigger the anchor.
  const handleCardClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return <div className={classes.descriptionHoverCard} onClick={handleCardClick}>
    <div className={classes.hoverCardHeader}>
      <div>
        <Link to={url} className={classes.hoverCardTitle}>{title}</Link>
        {authorName && <div className={classes.hoverCardAuthor}>{authorName}</div>}
      </div>
      <BookmarkButton documentId={documentId} collectionName={collectionName} initial={isBookmarked} />
    </div>
    <div className={classes.hoverCardDescription}>
      {description}
    </div>
    <Link to={url} className={classes.hoverCardReadMore}>(read more)</Link>
  </div>;
};

// Collapsed-row description: two-line clamp, with a post-preview-style
// hover-over card (title, author, save button, description, read-more).
// Shared with LibraryCollectionRow.
export const LibraryRowCollapsedDescription = (props: LibraryRowHoverCardProps) => {
  const classes = useStyles(libraryRowStyles);
  const { description } = props;

  return <HoverOver
    title={<LibraryRowHoverCard {...props} />}
    placement="bottom-end"
    tooltip={false}
    clickable
    hideOnTouchScreens
    inlineBlock={false}
    As="div"
    analyticsProps={{ pageElementContext: 'libraryRowDescription' }}
  >
    <div className={classes.rowDescription}>
      {description}
    </div>
  </HoverOver>;
};

interface LibraryChecklistRow {
  key: string;
  label: string;
  read: boolean;
  // How many posts the row stands for, for the "n more posts" arithmetic.
  // Chapter/book/sequence rows set this; post rows (the default) stand for
  // one post each.
  postsCount?: number;
  // When set (post and sequence rows), the label links directly there.
  url?: string;
  // When set (post rows), the checkbox toggles the post's read status.
  postId?: string;
}

const LibraryChecklistRowItem = ({row}: {
  row: LibraryChecklistRow,
}) => {
  const classes = useStyles(libraryRowStyles);
  const { postsRead, setPostRead } = useItemsRead();
  const [markAsReadOrUnread] = useMutation(LibraryRowMarkAsReadMutation);

  // Post rows reflect (and toggle) the client-side read cache; aggregate
  // chapter/book rows just show their server-derived state.
  const isRead = row.postId && row.postId in postsRead ? postsRead[row.postId] : row.read;

  const handleCheckboxClick = () => {
    if (!row.postId) {
      return;
    }
    void markAsReadOrUnread({
      variables: { postId: row.postId, isRead: !isRead },
    });
    setPostRead(row.postId, !isRead);
  };

  const checkbox = <span
    className={classNames(classes.chapterCheckbox, isRead && classes.chapterCheckboxRead, row.postId && classes.chapterCheckboxClickable)}
    onClick={row.postId ? handleCheckboxClick : undefined}
    role={row.postId ? 'checkbox' : undefined}
    aria-checked={row.postId ? !!isRead : undefined}
  >
    {isRead && <CheckIcon className={classes.checkIcon} />}
  </span>;

  const label = row.url
    ? <Link to={row.url} className={classNames(classes.chapterLabel, isRead && classes.chapterLabelRead)}>
        {row.label}
      </Link>
    : <span className={classNames(classes.chapterLabel, isRead && classes.chapterLabelRead)}>
        {row.label}
      </span>;

  return <div className={classes.chapterRow}>
    {row.postId
      ? <LWTooltip title={isRead ? 'Mark as unread' : 'Mark as read'}>{checkbox}</LWTooltip>
      : checkbox}
    {row.postId
      // Same post-preview hover as post titles on sequence pages
      // (SequencesSmallPostLink).
      ? <PostsTooltip
          postId={row.postId}
          preload="on-screen"
          postsList={true}
          placement="left-start"
          inlineBlock={false}
          clickable
        >
          {label}
        </PostsTooltip>
      : label}
  </div>;
};

// The expansion body's height is set by the chapter checklist (capped at
// MAX_CHECKLIST_ROWS); the description clamps to however many lines fit
// beside it, so long descriptions never make the expansion taller.
export const LibraryRowExpansionBody = ({description, rows, totalPostsCount, viewLink, viewLinkLabel, saveButton}: {
  description: string | null,
  rows: LibraryChecklistRow[],
  totalPostsCount: number,
  viewLink: string,
  viewLinkLabel: string,
  saveButton: React.ReactNode,
}) => {
  const classes = useStyles(libraryRowStyles);
  const chaptersColumnRef = useRef<HTMLDivElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const [descriptionClamp, setDescriptionClamp] = useState(MAX_CHECKLIST_ROWS);
  const [descriptionOverflows, setDescriptionOverflows] = useState(false);

  const shownRows = rows.slice(0, MAX_CHECKLIST_ROWS);
  // "More" counts posts, but rows may be chapters or books, so subtract the
  // posts the shown rows stand for rather than the number of rows.
  const shownPostsCount = shownRows.reduce((sum, row) => sum + (row.postsCount ?? 1), 0);
  const morePostsCount = Math.max(0, totalPostsCount - shownPostsCount);

  useLayoutEffect(() => {
    const measure = () => {
      const height = chaptersColumnRef.current?.getBoundingClientRect().height ?? 0;
      if (height > 0) {
        setDescriptionClamp(Math.max(MIN_DESCRIPTION_LINES, Math.floor(height / DESCRIPTION_LINE_HEIGHT)));
      }
      // Overflow also depends on the description column's width (e.g.
      // crossing the xs breakpoint), so re-check it on resize too.
      const element = descriptionRef.current;
      setDescriptionOverflows(!!element && element.scrollHeight > element.clientHeight + 1);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [shownRows.length, morePostsCount]);

  // The "(read full description)" link only appears while the clamp is
  // actually hiding text; re-check after the clamp value applies.
  useLayoutEffect(() => {
    const element = descriptionRef.current;
    setDescriptionOverflows(!!element && element.scrollHeight > element.clientHeight + 1);
  }, [descriptionClamp, description]);

  return <div className={classes.body}>
    <div>
      {description && <>
        <Link to={viewLink} className={classes.descriptionLink}>
          <p ref={descriptionRef} className={classes.description} style={{WebkitLineClamp: descriptionClamp}}>
            {description}
          </p>
        </Link>
        {descriptionOverflows && <Link to={viewLink} className={classes.readFullDescription}>
          (read full description →)
        </Link>}
      </>}
    </div>
    <div ref={chaptersColumnRef}>
      {shownRows.map(row => <LibraryChecklistRowItem key={row.key} row={row} />)}
      {morePostsCount > 0 && <div className={classes.morePostsRow}>
        <Link to={viewLink} className={classes.morePostsLink}>
          {morePostsCount} more post{morePostsCount === 1 ? '' : 's'}
        </Link>
      </div>}
      <div className={classes.bodyFooter}>
        <Link to={viewLink} className={classes.footerLink}>
          {viewLinkLabel}
          <ArrowForwardIcon className={classes.linkIcon} />
        </Link>
        {saveButton}
      </div>
    </div>
  </div>;
};

const LibrarySequenceRowBody = ({sequence, saveButton}: {
  sequence: LibrarySequenceRowFragment,
  saveButton: React.ReactNode,
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
  const titledChapterPostsCount = titledChapters.reduce((sum, ch) => sum + (ch.posts?.length ?? 0), 0);

  // Sequences whose posts mostly live in titled chapters (e.g. Iterated
  // Amplification) show a chapter checklist; otherwise fall back to a
  // checklist of the sequence's posts. Requiring a majority (not just one
  // titled chapter) keeps sequences whose real content is one untitled
  // chapter plus a small titled "Interlude"/"Appendix" (Embedded Agency,
  // most Codex sequences) on the post checklist.
  const checklistRows = titledChapterPostsCount * 2 >= allPosts.length && titledChapters.length > 0
    ? titledChapters.map(chapter => ({
        key: chapter._id,
        label: chapter.title ?? '',
        read: !!chapter.posts?.length && chapter.posts.every(post => post.isRead),
        postsCount: chapter.posts?.length ?? 0,
      }))
    : allPosts.map(post => ({
        key: post._id,
        label: post.title,
        read: !!post.isRead,
        url: postGetPageUrl(post, false, sequence._id),
        postId: post._id,
      }));

  return <LibraryRowExpansionBody
    description={sequence.contents?.plaintextDescription ?? null}
    rows={checklistRows}
    totalPostsCount={sequence.postsCount ?? 0}
    viewLink={sequenceGetPageUrl(sequence)}
    viewLinkLabel="View sequence"
    saveButton={saveButton}
  />;
};

const LibrarySequenceRow = ({sequence, expanded, onToggle}: {
  sequence: LibrarySequenceRowFragment,
  expanded: boolean,
  onToggle: () => void,
}) => {
  const classes = useStyles(libraryRowStyles);
  const { icon: bookmarkIcon, hoverText: bookmarkHoverText, toggleBookmark } = useBookmark(sequence._id, "Sequences", sequence.isBookmarked);
  // Collapsed rows show up to two core tags (stacked), falling back to the
  // first topic label for sequences with no core tag.
  const coreTags = sequence.libraryTags.filter(isCoreLibraryTag).slice(0, 2);
  const collapsedTags = coreTags.length > 0 ? coreTags : sequence.libraryTags.slice(0, 1);

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
        {sequence.contents?.plaintextDescription && <LibraryRowCollapsedDescription
          title={sequence.title ?? ''}
          authorName={sequence.user?.displayName ?? null}
          description={sequence.contents.plaintextDescription}
          url={sequenceGetPageUrl(sequence)}
          documentId={sequence._id}
          collectionName="Sequences"
          isBookmarked={sequence.isBookmarked}
        />}
      </div>
      <span className={classes.rightMeta}>
        <span className={classes.author}>{sequence.user?.displayName}</span>
        <span className={classes.pillCell}>
          {collapsedTags.map(tag => <span
            key={tag._id}
            className={classNames(classes.topicChip, isCoreLibraryTag(tag) && classes.coreTagChip)}
          >
            {tag.name}
          </span>)}
        </span>
      </span>
    </div>;
  }

  const postsCount = sequence.postsCount ?? 0;
  const readPostsCount = sequence.readPostsCount ?? 0;
  const progressPercent = postsCount > 0 ? Math.round((readPostsCount / postsCount) * 100) : 0;

  return <div className={classes.expandedWrapper}>
    <div className={classes.expandedHeader}>
      {cover}
      <div className={classes.titleCell}>
        <div className={classes.title}>
          <Link to={sequenceGetPageUrl(sequence)}>
            {sequence.title}
          </Link>
          {sequence.curatedOrder != null && <StarIcon className={classes.star} />}
        </div>
        <div className={classes.metaLine}>
          <UsersName user={sequence.user} />
          {postsCount > 0 && <>
            {' · '}
            <LWTooltip
              title={`${readPostsCount} / ${postsCount} read`}
              placement="bottom-start"
              distance={6}
            >
              <span className={classes.progressCaption}>{progressPercent}% read</span>
            </LWTooltip>
            {progressPercent > 0 && <span className={classes.progressTrack}>
              <span className={classes.progressFill} style={{width: `${progressPercent}%`}} />
            </span>}
          </>}
        </div>
      </div>
      <span className={classes.headerRight}>
        <span className={classes.headerTags}>
          {sequence.libraryTags.map(tag => <span
            key={tag._id}
            className={classNames(classes.topicChip, isCoreLibraryTag(tag) && classes.coreTagChip)}
          >
            {tag.name}
          </span>)}
        </span>
        <a className={classes.collapseToggle} onClick={onToggle} role="button" aria-label="Collapse">
          [<span>-</span>]
        </a>
      </span>
    </div>
    <LibrarySequenceRowBody sequence={sequence} saveButton={
      <LWTooltip title={bookmarkHoverText} placement="right" className={classes.save}>
        <span onClick={handleSaveClick}>
          <ForumIcon icon={bookmarkIcon} className={classes.saveIcon} />
        </span>
      </LWTooltip>
    } />
  </div>;
};

export default LibrarySequenceRow;
