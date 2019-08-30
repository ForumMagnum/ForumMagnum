import React, { Component } from 'react';
import { Components, withDocument, registerComponent } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import Collections from '../../lib/collections/collections/collection.js';
import Button from '@material-ui/core/Button';
import { Link } from '../../lib/reactRouterWrapper.js';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { postBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
  },
  header: {
    marginBottom: 50,
  },
  startReadingButton: {
    background: "rgba(0,0,0, 0.05)",

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
    lineHeight: 1,
    paddingTop: 10,
  },
  description: {
    fontSize: 20,
    marginTop: 30,
    marginBottom: 25,
    lineHeight: 1.25,
    maxWidth: 700,
    ...postBodyStyles(theme),
  },
});

class CollectionsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
    }
  }

  showEdit = () => {
    this.setState({edit: true})
  }

  showCollection = () => {
    this.setState({edit: false})
  }

  render() {
    const {document, currentUser, loading, classes} = this.props;
    const { SingleColumnSection, BooksItem, BooksNewForm, SectionButton, ContentItemBody } = Components
    if (loading || !document) {
      return <Components.Loading />;
    } else if (this.state.edit) {
      return <Components.CollectionsEditForm
                documentId={document._id}
                successCallback={this.showCollection}
                cancelCallback={this.showCollection} />
    } else {
      const startedReading = false; //TODO: Check whether user has started reading sequences
      const collection = document;
      const canEdit = Users.canDo(currentUser, 'collections.edit.all') || (Users.canDo(currentUser, 'collections.edit.own') && Users.owns(currentUser, collection))
      const { html = "" } = collection.contents || {}
      return (<div className={classes.root}>
        <SingleColumnSection>
          <div className={classes.header}>
            <Typography variant="h2" className={classes.title}>{collection.title}</Typography>

            {canEdit && <SectionButton><a onClick={this.showEdit}>Edit</a></SectionButton>}

            <div className={classes.description}>
              {html && <ContentItemBody dangerouslySetInnerHTML={{__html: html}}/>}
            </div>

            <Button
              className={classes.startReadingButton}
              component={Link} to={document.firstPageLink}
            >
              {startedReading ? "Continue Reading" : "Start Reading"}
            </Button>
          </div>
        </SingleColumnSection>
        <div>
          {/* For each book, print a section with a grid of sequences */}
          {collection.books.map(book => <BooksItem key={book._id} collection={collection} book={book} canEdit={canEdit} />)}
        </div>
        {canEdit && <SingleColumnSection>
          <BooksNewForm prefilledProps={{collectionId: collection._id}} />
        </SingleColumnSection>}
      </div>);
    }
  }
}

const options = {
  collection: Collections,
  queryName: "CollectionsPageQuery",
  fragmentName: 'CollectionsPageFragment',
  enableTotal: false,
  ssr: true,
};

registerComponent('CollectionsPage', CollectionsPage, [withDocument, options], withUser, withStyles(styles, {name: "CollectionsPage"}));
