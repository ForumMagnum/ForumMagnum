import React, { MouseEvent } from 'react';
import classNames from 'classnames';
import sortBy from 'lodash/sortBy';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { Link } from '../../lib/reactRouterWrapper';
import { collectionGetPageUrl } from '../../lib/collections/collections/helpers';
import { useBookmark } from '../hooks/useBookmark';
import PortraitCoverImage from './PortraitCoverImage';
import ForumIcon from '../common/ForumIcon';
import Loading from '../vulcan-core/Loading';
import { ContentItemBody } from '../contents/ContentItemBody';
import KeyboardArrowRightIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowRight';
import ExpandMoreIcon from '@/lib/vendor/@material-ui/icons/src/ExpandMore';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import ArrowForwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowForward';
import { useStyles } from '@/components/hooks/useStyles';
import { libraryRowStyles, toRomanNumeral } from './LibrarySequenceRow';

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

  const books = sortBy(expansion?.books ?? [], book => book.number ?? 0);
  const titledBooks = books.filter(book => book.tocTitle || book.title);
  const hasProgress = collection.readPostsCount > 0;

  if (loading || !expansion) {
    return <div className={classes.body}>
      <Loading />
    </div>;
  }

  return <div className={classes.body}>
    {expansion.contents?.html && <ContentItemBody
      dangerouslySetInnerHTML={{__html: expansion.contents.html}}
      description={`collection ${collection._id}`}
      className={classes.description}
    />}
    {titledBooks.length > 0 && <div className={classes.chapterGrid}>
      {titledBooks.map((book, i) => {
        const completed = book.postsCount > 0 && book.readPostsCount >= book.postsCount;
        return <div key={book._id} className={classes.chapterEntry}>
          <span className={classes.chapterNumeral}>{toRomanNumeral(i + 1)}</span>
          <span className={classNames(classes.chapterName, completed && classes.chapterNameCompleted)}>
            {book.tocTitle || book.title}{completed && " ✓"}
          </span>
        </div>;
      })}
    </div>}
    <div className={classes.bodyFooter}>
      <Link
        to={collectionGetPageUrl(collection)}
        className={classNames(classes.footerLink, classes.viewSequenceLink)}
      >
        View collection
        <ArrowForwardIcon className={classes.linkIcon} />
      </Link>
      {/* Unlike sequence rows this doesn't enroll in continue-reading:
          firstPageLink is an arbitrary path, not a post id, so there's
          nothing to pass to updateContinueReading. */}
      {!collection.hideStartReadingButton && <Link
        to={collection.firstPageLink}
        className={classNames(classes.footerLink, classes.startReadingLink)}
      >
        {hasProgress ? "Continue reading" : "Start reading"}
        <ArrowForwardIcon className={classes.linkIcon} />
      </Link>}
    </div>
  </div>;
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
        <div className={classes.expandedTitle}>{collection.title}</div>
        <div className={classes.metaLine}>
          {collection.user?.displayName} · {collection.postsCount} posts
        </div>
      </div>
      <span className={classes.headerActions}>
        <span className={classes.save} onClick={handleSaveClick}>
          <ForumIcon icon={bookmarkIcon} className={classes.saveIcon} />
          {bookmarkLabel}
        </span>
        {collection.libraryTopic && <span className={classes.topicChip}>{collection.libraryTopic}</span>}
      </span>
      <ExpandMoreIcon className={classes.chevron} />
    </div>
    <LibraryCollectionRowBody collection={collection} />
  </div>;
};

export default LibraryCollectionRow;
