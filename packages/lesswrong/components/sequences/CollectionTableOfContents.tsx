import React from 'react';
import { registerComponent, Components, slugify } from '../../lib/vulcan-lib';
import { ToCSection } from '../../server/tableOfContents';
import { commentBodyStyles } from '../../themes/stylePiping';
import { getAnchorId } from '../common/SectionTitle';

const styles = (theme: ThemeType): JssStyles => ({
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
  classes: ClassesType,
  collection: CollectionsPageFragment
}) => {
  const { TableOfContents } = Components 

  const sections: ToCSection[] = [] 

  collection.books.forEach(book => {
    if (book.title) {
      sections.push(({
        title: book.title,
        anchor: slugify(book.title),
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
    sections: sections,
    headingsCount: sections.length
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

