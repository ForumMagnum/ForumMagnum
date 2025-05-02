import React from 'react';
import { getBookAnchor } from '../../lib/collections/books/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { ToCSection } from '../../lib/tableOfContents';
import { commentBodyStyles } from '../../themes/stylePiping';

const styles = (theme: ThemeType) => ({
  root: {
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
  classes: ClassesType<typeof styles>,
  collection: CollectionsPageFragment
}) => {
  const { TableOfContents } = Components 

  const sections: ToCSection[] = [] 

  collection.books.forEach(book => {
    if (book.tocTitle || book.title) {
      sections.push(({
        title: (book.tocTitle || book.title) ?? undefined,
        anchor: getBookAnchor(book), // this needs to match the anchor in 
        level: 1
      }))
    }
    book.sequences.forEach(sequence => {
      if (sequence.title) {
        sections.push(({
          title: sequence.title,
          anchor: sequence._id,
          level: 2
        }))
      }
    })
  })

  const sectionData = {
    html: "",
    sections,
  }

  return <TableOfContents
    sectionData={sectionData}
    title={collection.title}
  />
}

const CollectionTableOfContentsComponent = registerComponent('CollectionTableOfContents', CollectionTableOfContents, {styles});

declare global {
  interface ComponentTypes {
    CollectionTableOfContents: typeof CollectionTableOfContentsComponent
  }
}

