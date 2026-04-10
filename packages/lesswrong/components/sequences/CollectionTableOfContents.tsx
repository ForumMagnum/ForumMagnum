import React from 'react';
import { getBookAnchor } from '../../lib/collections/books/helpers';
import type { ToCSection } from '../../lib/tableOfContents';
import TableOfContents from "../posts/TableOfContents/TableOfContents";

export const CollectionTableOfContents = ({collection}: {
  collection: CollectionsPageFragment
}) => {
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

export default CollectionTableOfContents;
