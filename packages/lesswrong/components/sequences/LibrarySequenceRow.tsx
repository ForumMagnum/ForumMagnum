import React, { MouseEvent } from 'react';
import classNames from 'classnames';
import sortBy from 'lodash/sortBy';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import { useBookmark } from '../hooks/useBookmark';
import { useUpdateContinueReading } from './useUpdateContinueReading';
import PortraitCoverImage from './PortraitCoverImage';
import ForumIcon from '../common/ForumIcon';
import Loading from '../vulcan-core/Loading';
import { ContentItemBody } from '../contents/ContentItemBody';
import KeyboardArrowRightIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowRight';
import ExpandMoreIcon from '@/lib/vendor/@material-ui/icons/src/ExpandMore';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import ArrowForwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowForward';
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

const ROMAN_NUMERAL_TABLE: Array<[number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRomanNumeral(n: number): string {
  let result = '';
  for (const [value, numeral] of ROMAN_NUMERAL_TABLE) {
    while (n >= value) {
      result += numeral;
      n -= value;
    }
  }
  return result;
}

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
    fontFamily: theme.typography.headerStyle.fontFamily,
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
    fontFamily: theme.typography.postStyle.fontFamily,
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
  expandedTitle: {
    fontFamily: theme.typography.headerStyle.fontFamily,
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
  headerActions: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
  },
  save: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: theme.palette.text.secondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13.5,
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
    padding: '6px 24px 20px 68px',
  },
  description: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 15,
    lineHeight: '22px',
    color: theme.palette.text.secondary,
    maxWidth: 660,
    '& p': {
      margin: '0 0 8px',
    },
    '& p:last-child': {
      marginBottom: 0,
    },
  },
  chapterGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2px 40px',
    marginTop: 14,
    maxWidth: 660,
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: '1fr',
    },
  },
  chapterEntry: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    padding: '3px 0',
  },
  chapterNumeral: {
    width: 16,
    flex: 'none',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
  },
  chapterName: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 14,
    color: theme.palette.text.normal,
  },
  chapterNameCompleted: {
    color: theme.palette.text.secondary,
  },
  bodyFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '16px',
    marginTop: 14,
    maxWidth: 660,
  },
  footerLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 14.5,
    fontWeight: 500,
  },
  viewSequenceLink: {
    color: theme.palette.text.secondary,
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  startReadingLink: {
    color: theme.palette.primary.main,
  },
  linkIcon: {
    fontSize: 17,
  },
}));

const LibrarySequenceRowBody = ({sequence}: {
  sequence: LibrarySequenceRowFragment,
}) => {
  const classes = useStyles(libraryRowStyles);
  const { data, loading } = useQuery(LibrarySequenceExpansionQuery, {
    variables: { sequenceId: sequence._id },
  });
  const expansion = data?.sequence?.result;

  const chapters = sortBy(expansion?.chapters ?? [], ch => ch.number ?? 0);
  const titledChapters = chapters.filter(ch => ch.title);
  const allPosts = chapters.flatMap(ch => ch.posts ?? []).filter(post => !!post);
  const firstUnreadPost = allPosts.find(post => !post.isRead) ?? allPosts[0];
  const hasProgress = (sequence.readPostsCount ?? 0) > 0;
  const updateContinueReading = useUpdateContinueReading(firstUnreadPost?._id, sequence._id);

  if (loading || !expansion) {
    return <div className={classes.body}>
      <Loading />
    </div>;
  }

  return <div className={classes.body}>
    {expansion.contents?.html && <ContentItemBody
      dangerouslySetInnerHTML={{__html: expansion.contents.html}}
      description={`sequence ${sequence._id}`}
      className={classes.description}
    />}
    {titledChapters.length > 0 && <div className={classes.chapterGrid}>
      {titledChapters.map((chapter, i) => {
        const completed = !!chapter.posts?.length && chapter.posts.every(post => post?.isRead);
        return <div key={chapter._id} className={classes.chapterEntry}>
          <span className={classes.chapterNumeral}>{toRomanNumeral(i + 1)}</span>
          <span className={classNames(classes.chapterName, completed && classes.chapterNameCompleted)}>
            {chapter.title}{completed && " ✓"}
          </span>
        </div>;
      })}
    </div>}
    <div className={classes.bodyFooter}>
      <Link
        to={sequenceGetPageUrl(sequence)}
        className={classNames(classes.footerLink, classes.viewSequenceLink)}
      >
        View sequence
        <ArrowForwardIcon className={classes.linkIcon} />
      </Link>
      {firstUnreadPost && <Link
        to={postGetPageUrl(firstUnreadPost, false, sequence._id)}
        className={classNames(classes.footerLink, classes.startReadingLink)}
        onClick={updateContinueReading}
      >
        {hasProgress ? "Continue reading" : "Start reading"}
        <ArrowForwardIcon className={classes.linkIcon} />
      </Link>}
    </div>
  </div>;
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
      <div className={classes.titleCell}>
        <div className={classes.expandedTitle}>{sequence.title}</div>
        <div className={classes.metaLine}>
          {sequence.user?.displayName} · {sequence.postsCount} posts
        </div>
      </div>
      <span className={classes.headerActions}>
        <span className={classes.save} onClick={handleSaveClick}>
          <ForumIcon icon={bookmarkIcon} className={classes.saveIcon} />
          {bookmarkLabel}
        </span>
        {sequence.libraryTopics.map(topic => <span key={topic} className={classes.topicChip}>{topic}</span>)}
      </span>
      <ExpandMoreIcon className={classes.chevron} />
    </div>
    <LibrarySequenceRowBody sequence={sequence} />
  </div>;
};

export default LibrarySequenceRow;
