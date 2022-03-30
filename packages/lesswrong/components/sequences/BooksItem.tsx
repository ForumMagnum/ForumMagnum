import React, { useState, useCallback } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
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
        boxShadow: "0 1px 6px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.12)",
      },
      boxShadow: "0 1px 6px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.1)",
      textDecoration: "none",
    }
  },
});

const BooksItem = ({ book, canEdit, classes }: {
  book: BookPageFragment,
  canEdit: boolean,
  classes: ClassesType,
}) => {
  const [edit,setEdit] = useState(false);

  const { html = "" } = book.contents || {}
  const { SingleColumnSection, SectionTitle, SectionButton, SequencesGrid,
    SequencesPostsList, Divider, ContentItemBody, ContentStyles } = Components
  
  const showEdit = useCallback(() => {
    setEdit(true);
  }, []);
  const showBook = useCallback(() => {
    setEdit(false);
  }, []);

  if (edit) {
    return <Components.BooksEditForm
      documentId={book._id}
      successCallback={showBook}
      cancelCallback={showBook}
    />
  } else {
    return <div className="books-item">
      <SingleColumnSection>
        <SectionTitle title={book.title}>
          {canEdit && <SectionButton><a onClick={showEdit}>Edit</a></SectionButton>}
        </SectionTitle>
        <div className={classes.subtitle}>{book.subtitle}</div>
        {html  && <ContentStyles contentType="post" className={classes.description}>
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: html}}
            description={`book ${book._id}`}
          />
        </ContentStyles>}

        {book.posts && !!book.posts.length && <div className={classes.posts}>
          <SequencesPostsList posts={book.posts} />
        </div>}

        <SequencesGrid sequences={book.sequences} bookItemStyle/>
      </SingleColumnSection>
      <Divider />
    </div>
  }
}

const BooksItemComponent = registerComponent('BooksItem', BooksItem, {styles});

declare global {
  interface ComponentTypes {
    BooksItem: typeof BooksItemComponent
  }
}

