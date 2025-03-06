import React, { useState, useCallback } from 'react';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { getBookAnchor } from '../../lib/collections/books/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import BooksProgressBar from "@/components/sequences/BooksProgressBar";
import { SectionTitle } from "@/components/common/SectionTitle";
import SectionButton from "@/components/common/SectionButton";
import LargeSequencesItem from "@/components/sequences/LargeSequencesItem";
import SequencesPostsList from "@/components/sequences/SequencesPostsList";
import ContentItemBody from "@/components/common/ContentItemBody";
import { ContentStyles } from "@/components/common/ContentStyles";
import SequencesGrid from "@/components/sequences/SequencesGrid";
import BooksEditForm from "@/components/sequences/BooksEditForm";

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
  const showEdit = useCallback(() => {
    setEdit(true);
  }, []);
  const showBook = useCallback(() => {
    setEdit(false);
  }, []);

  if (edit) {
    return <BooksEditForm
      documentId={book._id}
      successCallback={showBook}
      cancelCallback={showBook}
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

export default BooksItemComponent;

