import React, { useState, useCallback } from 'react';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { getBookAnchor } from '../../lib/collections/books/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { BooksForm } from './BooksForm';
import { useSingle } from '@/lib/crud/withSingle';

const styles = (theme: ThemeType) => ({
  description: {
    marginTop: theme.spacing.unit,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 1.1,
    fontStyle: "italic",
    marginBottom: 20,
  },
  posts: {
    marginLeft: 20,
    marginRight: 25,
    marginBottom: 30,
    "& .posts-item": { // UNUSED (.posts-item isn't a real clas)
      "&:hover": {
        boxShadow: `0 1px 6px ${theme.palette.boxShadowColor(0.12)}, 0 1px 4px ${theme.palette.boxShadowColor(0.12)}`,
      },
      boxShadow: `0 1px 6px ${theme.palette.boxShadowColor(0.06)}, 0 1px 4px ${theme.palette.boxShadowColor(0.12)}`,
      textDecoration: "none",
    }
  },
});

const BooksItem = ({ book, canEdit, classes }: {
  book: BookPageFragment,
  canEdit: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const [edit,setEdit] = useState(false);

  const { html = "" } = book.contents || {}
  const { BooksProgressBar, SectionTitle, SectionButton, LargeSequencesItem,
    SequencesPostsList, ContentItemBody, ContentStyles, SequencesGrid } = Components

  const { document: editableBook, loading } = useSingle({
    collectionName: 'Books',
    documentId: book._id,
    fragmentName: 'BookEdit',
    skip: !edit,
  });
  
  const showEdit = useCallback(() => {
    setEdit(true);
  }, []);
  const showBook = useCallback(() => {
    setEdit(false);
  }, []);

  if (loading) {
    return <Components.Loading />
  } else if (edit) {
    return <BooksForm
      initialData={editableBook}
      collectionId={book.collectionId}
      onSuccess={showBook}
      onCancel={showBook}
    />
  } else {
    return <div>
        <SectionTitle title={book.title} anchor={getBookAnchor(book)}>
          {canEdit && <SectionButton><a onClick={showEdit}>Edit</a></SectionButton>}
        </SectionTitle>
        {book.subtitle && <div className={classes.subtitle}>{book.subtitle}</div>}

        <AnalyticsContext pageElementContext="booksProgressBar">
          <BooksProgressBar book={book} />
        </AnalyticsContext>

        {html  && <ContentStyles contentType="post" className={classes.description}>
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: html}}
            description={`book ${book._id}`}
          />
        </ContentStyles>}

        {book.posts && !!book.posts.length && <div className={classes.posts}>
          <SequencesPostsList posts={book.posts} />
        </div>}

        {book.displaySequencesAsGrid && <SequencesGrid sequences={book.sequences}/>}
        {!book.displaySequencesAsGrid && book.sequences.map(sequence =>
          <LargeSequencesItem key={sequence._id} sequence={sequence} showChapters={book.showChapters} />
        )}
    </div>
  }
}

const BooksItemComponent = registerComponent('BooksItem', BooksItem, {styles});

declare global {
  interface ComponentTypes {
    BooksItem: typeof BooksItemComponent
  }
}

