import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "sticky",
    top: 12,
    ...commentBodyStyles(theme),
    color: theme.palette.grey[600]
  },
  collectionTitle: {
    borderBottom: theme.palette.border.grey300,
    paddingBottom: 24
  },
  bookTitle: {
    marginTop: 20,
    marginBottom: 20
  },
  sequenceTitle: {
    marginTop: 3,
    marginBottom: 3
  }
});

export const CollectionTableOfContents = ({classes, collection}: {
  classes: ClassesType,
  collection: CollectionsPageFragment
}) => {
  return <div className={classes.root}>
    <div className={classes.collectionTitle}>{collection.title}</div>
    {collection.books.map(book => <div key={book._id}>
      <div className={classes.bookTitle}>{book.title}</div>
      {book.sequences.map(sequence => <div key={sequence._id} className={classes.sequenceTitle}>
        {sequence.title}
      </div>)}
    </div>)}
  </div>;
}

const CollectionTableOfContentsComponent = registerComponent('CollectionTableOfContents', CollectionTableOfContents, {styles});

declare global {
  interface ComponentTypes {
    CollectionTableOfContents: typeof CollectionTableOfContentsComponent
  }
}

