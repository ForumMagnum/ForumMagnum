import React, { Component } from 'react';
import { Components, withDocument, registerComponent } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import Collections from '../../lib/collections/collections/collection.js';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    marginRight: 90,
  },
  header: {
    paddingLeft: 20,
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
        <Components.Section titleComponent={canEdit ? <a onClick={this.showEdit}>edit</a> : null}>
          <div className={classes.header}>
            <Typography variant="display3" className={classes.title}>{collection.title}</Typography>
            <div className={classes.description}>
              {html && <div className="content-body" dangerouslySetInnerHTML={{__html: html}}/>}
            </div>
            <Button
              className={classes.startReadingButton}
              component={Link} to={document.firstPageLink}
            >
              {startedReading ? "Continue Reading" : "Start Reading"}
            </Button>
          </div>
        </Components.Section>
        <div className="collections-page-content">
          {/* For each book, print a section with a grid of sequences */}
          {collection.books.map(book => <Components.BooksItem key={book._id} collection={collection} book={book} canEdit={canEdit} />)}
        </div>
        {canEdit ? <Components.BooksNewForm prefilledProps={{collectionId: collection._id}} /> : null}
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
