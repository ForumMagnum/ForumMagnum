import React, { MouseEvent } from 'react';
import sortBy from 'lodash/sortBy';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { collectionGetPageUrl } from '../../lib/collections/collections/helpers';
import { useBookmark } from '../hooks/useBookmark';
import PortraitCoverImage from './PortraitCoverImage';
import ForumIcon from '../common/ForumIcon';
import LWTooltip from '../common/LWTooltip';
import Loading from '../vulcan-core/Loading';
import KeyboardArrowRightIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowRight';
import ExpandMoreIcon from '@/lib/vendor/@material-ui/icons/src/ExpandMore';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import { useStyles } from '@/components/hooks/useStyles';
import { libraryRowStyles, LibraryRowExpansionBody } from './LibrarySequenceRow';

const LibraryCollectionExpansionQuery = gql(`
  query LibraryCollectionExpansion($collectionId: String) {
    collection(selector: { _id: $collectionId }) {
      result {
        ...LibraryCollectionExpansionFragment
      }
    }
  }
`);

const LibraryCollectionRowBody = ({collection}: {
  collection: LibraryCollectionRowFragment,
}) => {
  const classes = useStyles(libraryRowStyles);
  const { data, loading } = useQuery(LibraryCollectionExpansionQuery, {
    variables: { collectionId: collection._id },
  });
  const expansion = data?.collection?.result;

  if (loading || !expansion) {
    return <div className={classes.body}>
      <Loading />
    </div>;
  }

  const books = sortBy(expansion.books ?? [], book => book.number ?? 0);
  const checklistRows = books
    .filter(book => book.tocTitle || book.title)
    .map(book => ({
      key: book._id,
      label: book.tocTitle || book.title || '',
      read: book.postsCount > 0 && book.readPostsCount >= book.postsCount,
    }));

  return <LibraryRowExpansionBody
    description={collection.contents?.plaintextDescription ?? null}
    rows={checklistRows}
    totalPostsCount={collection.postsCount}
    viewLink={collectionGetPageUrl(collection)}
    viewLinkLabel="View collection"
  />;
};

const LibraryCollectionRow = ({collection, expanded, onToggle}: {
  collection: LibraryCollectionRowFragment,
  expanded: boolean,
  onToggle: () => void,
}) => {
  const classes = useStyles(libraryRowStyles);
  const { icon: bookmarkIcon, labelText: bookmarkLabel, toggleBookmark } = useBookmark(collection._id, "Collections");

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
    coverImageId={collection.coverImageId}
    gridImageId={collection.gridImageId}
    title={collection.title}
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
          {collection.title}
          <StarIcon className={classes.star} />
        </div>
        {collection.contents?.plaintextDescription && <div className={classes.rowDescription}>
          {collection.contents.plaintextDescription}
        </div>}
      </div>
      <span className={classes.rightMeta}>
        <span className={classes.author}>{collection.user?.displayName}</span>
        <span>
          {collection.libraryTopic && <span className={classes.topicPill}>{collection.libraryTopic}</span>}
        </span>
      </span>
      <KeyboardArrowRightIcon className={classes.chevron} />
    </div>;
  }

  const postsCount = collection.postsCount;
  const readPostsCount = collection.readPostsCount;
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
          <div className={classes.expandedTitle}>{collection.title}</div>
          <div className={classes.metaLine}>{collection.user?.displayName}</div>
        </div>
        {postsCount > 0 && <div className={classes.progressTrack}>
          <div className={classes.progressFill} style={{width: `${progressPercent}%`}} />
        </div>}
      </div>
      <span className={classes.headerActions}>
        {collection.libraryTopic && <span className={classes.topicChip}>{collection.libraryTopic}</span>}
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
    <LibraryCollectionRowBody collection={collection} />
  </div>;
};

export default LibraryCollectionRow;
