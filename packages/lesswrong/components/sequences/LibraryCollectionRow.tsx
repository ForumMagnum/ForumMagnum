import React, { MouseEvent } from 'react';
import classNames from 'classnames';
import sortBy from 'lodash/sortBy';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { collectionGetPageUrl } from '../../lib/collections/collections/helpers';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import UsersName from '../users/UsersName';
import { useBookmark } from '../hooks/useBookmark';
import PortraitCoverImage from './PortraitCoverImage';
import ForumIcon from '../common/ForumIcon';
import LWTooltip from '../common/LWTooltip';
import Loading from '../vulcan-core/Loading';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import { useStyles } from '@/components/hooks/useStyles';
import { libraryRowStyles, LibraryRowExpansionBody, LibraryRowCollapsedDescription } from './LibrarySequenceRow';

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
  const titledBooks = books.filter(book => book.tocTitle || book.title);

  // Collections with titled books (e.g. Rationality: A-Z) show a book
  // checklist; collections whose books are untitled containers (e.g. HPMOR's
  // single anonymous book) fall back to a checklist of the books' sequences.
  const checklistRows = titledBooks.length > 0
    ? titledBooks.map(book => ({
        key: book._id,
        label: book.tocTitle || book.title || '',
        read: book.postsCount > 0 && book.readPostsCount >= book.postsCount,
        postsCount: book.postsCount,
      }))
    : books
        .flatMap(book => book.sequences)
        .filter(sequence => sequence.title)
        .map(sequence => ({
          key: sequence._id,
          label: sequence.title ?? '',
          read: sequence.postsCount > 0 && sequence.readPostsCount >= sequence.postsCount,
          postsCount: sequence.postsCount,
          url: sequenceGetPageUrl(sequence),
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
  const { icon: bookmarkIcon, hoverText: bookmarkHoverText, toggleBookmark } = useBookmark(collection._id, "Collections", collection.isBookmarked);

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
        {collection.contents?.plaintextDescription && <LibraryRowCollapsedDescription
          title={collection.title}
          authorName={collection.user?.displayName ?? null}
          description={collection.contents.plaintextDescription}
          url={collectionGetPageUrl(collection)}
          documentId={collection._id}
          collectionName="Collections"
          isBookmarked={collection.isBookmarked}
        />}
      </div>
      <span className={classes.rightMeta}>
        <span className={classes.author}>{collection.user?.displayName}</span>
        <span className={classes.pillCell}>
          {collection.libraryTopic && <span className={classNames(classes.topicChip, classes.coreTagChip)}>{collection.libraryTopic}</span>}
        </span>
      </span>
    </div>;
  }

  const postsCount = collection.postsCount;
  const readPostsCount = collection.readPostsCount;
  const progressPercent = postsCount > 0 ? Math.round((readPostsCount / postsCount) * 100) : 0;

  return <div className={classes.expandedWrapper}>
    <div className={classes.expandedHeader}>
      {cover}
      <div className={classes.titleCell}>
        <div className={classes.title}>
          <Link to={collectionGetPageUrl(collection)}>
            {collection.title}
          </Link>
          <StarIcon className={classes.star} />
        </div>
        <div className={classes.metaLine}>
          <UsersName user={collection.user} />
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
          {collection.libraryTopic && <span className={classNames(classes.topicChip, classes.coreTagChip)}>{collection.libraryTopic}</span>}
        </span>
        <a className={classes.collapseToggle} onClick={onToggle} role="button" aria-label="Collapse">
          [<span>-</span>]
        </a>
      </span>
    </div>
    <LWTooltip title={bookmarkHoverText} placement="right" className={classes.save}>
      <span onClick={handleSaveClick}>
        <ForumIcon icon={bookmarkIcon} className={classes.saveIcon} />
      </span>
    </LWTooltip>
    <LibraryCollectionRowBody collection={collection} />
  </div>;
};

export default LibraryCollectionRow;
