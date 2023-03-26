import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { userCanDo, userOwns } from '../../lib/vulcan-users/permissions';
import Button from '@material-ui/core/Button';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const PADDING = 36
const COLLECTION_WIDTH = SECTION_WIDTH + (PADDING * 2)

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 32,
    position: "relative",
    [theme.breakpoints.down('sm')]: {
      paddingTop: 70,
      marginTop: -50,
      marginLeft: -8,
      marginRight: -8
    }
  },
  section: {
    marginBottom: 50,
    background: theme.palette.background.pageActiveAreaBackground,
    borderRadius: theme.borderRadius.default,
    padding: PADDING,
    maxWidth: COLLECTION_WIDTH,
    marginLeft: "auto",
    marginRight: "auto",
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
    [theme.breakpoints.up('md')]: {
      width: COLLECTION_WIDTH // TODO: replace this hacky solution with a more comprehensive refactoring of SingleColumnSection. 
      // (SingleColumnLayout should probably be replaced by grid-css in Layout.tsx)
    }
  },
  startReadingButton: {
    background: theme.palette.buttons.startReadingButtonBackground,

    // TODO: Pick typography for this button. (This is just the typography that
    // Material UI v0 happened to use.)
    fontWeight: 500,
    fontSize: "14px",
    fontFamily: "Roboto, sans-serif",
  },
  title: {
    ...theme.typography.headerStyle,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderTopStyle: "solid",
    borderTopWidth: 4,
    paddingTop: 10,
    lineHeight: 1,
    marginTop: 0,
  },
  description: {
    marginTop: 30,
    marginBottom: 25,
    lineHeight: 1.25,
    maxWidth: 700,
  },
});

const CollectionsPage = ({ documentId, classes }: {
  documentId: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const [edit, setEdit] = useState(false);
  const [addingBook, setAddingBook] = useState(false);
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Collections",
    fragmentName: 'CollectionsPageFragment',
  });

  const showEdit = useCallback(() => {
    setEdit(true);
  }, []);
  const showCollection = useCallback(() => {
    setEdit(false);
  }, []);

  const { SingleColumnSection, BooksItem, BooksNewForm, SectionFooter, SectionButton, ContentItemBody, Typography, ContentStyles, ErrorBoundary, CollectionTableOfContents, ToCColumn } = Components
  if (loading || !document) {
    return <Components.Loading />;
  } else if (edit) {
    return <Components.CollectionsEditForm
      documentId={document._id}
      successCallback={showCollection}
      cancelCallback={showCollection}
    />
  } else {
    const startedReading = false; //TODO: Check whether user has started reading sequences
    const collection = document;
    const canEdit = userCanDo(currentUser, 'collections.edit.all') || (userCanDo(currentUser, 'collections.edit.own') && userOwns(currentUser, collection))
    const { html = "" } = collection.contents || {}
    
    // Workaround: MUI Button takes a component option and passes extra props to
    // that component, but has a type signature which fails to include the extra
    // props
    const ButtonUntyped = Button as any;
    
    return (<ErrorBoundary><div className={classes.root}>
      <ToCColumn 
        tableOfContents={<CollectionTableOfContents collection={document}/>}
      >
        <div className={classes.section}>
          {collection.title && <Typography variant="display3" className={classes.title}>{collection.title}</Typography>}

          {canEdit && <SectionButton><a onClick={showEdit}>Edit</a></SectionButton>}

          <ContentStyles contentType="post" className={classes.description}>
            {html && <ContentItemBody dangerouslySetInnerHTML={{__html: html}} description={`collection ${document._id}`}/>}
          </ContentStyles>

          {!collection.hideStartReadingButton &&
            <ButtonUntyped
              className={classes.startReadingButton}
              component={Link} to={document.firstPageLink}
            >
              {startedReading ? "Continue Reading" : "Start Reading"}
            </ButtonUntyped>
          }
        </div>
        <div>
          {collection.books.map(book => <div className={classes.section} key={`collectionsPage${book._id}`}>
            <BooksItem key={book._id} book={book} canEdit={canEdit} />
          </div>)}
        </div>
        
        {canEdit && <SectionFooter>
          <SectionButton>
            <a onClick={() => setAddingBook(true)}>Add Book</a>
          </SectionButton>
        </SectionFooter>}
        {addingBook && <SingleColumnSection>
          <BooksNewForm prefilledProps={{collectionId: collection._id}} />
        </SingleColumnSection>}
      </ToCColumn>
      
    </div></ErrorBoundary>);
  }
}

const CollectionsPageComponent = registerComponent('CollectionsPage', CollectionsPage, {styles});

declare global {
  interface ComponentTypes {
    CollectionsPage: typeof CollectionsPageComponent
  }
}

