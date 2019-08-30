import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { postBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
  },
  description: {
    marginBottom: 20,
    ...postBodyStyles(theme),
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 1.1,
    fontStyle: "italic",
    marginTop: 20,
  },
  posts: {
    marginLeft: 20,
    marginRight: 25,
    marginBottom: 30,
    "& .posts-item": {
      "&:hover": {
        boxShadow: "0 1px 6px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.12)",
      },
      boxShadow: "0 1px 6px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.1)",
      textDecoration: "none",
    }
  },
});

class BooksItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
    }
  }

  showEdit = () => {
    this.setState({edit: true})
  }

  showBook = () => {
    this.setState({edit: false})
  }

  render() {
    const { book, classes, canEdit } = this.props;
    const { html = "" } = book.contents || {}
    const { SingleColumnSection, SectionTitle, SectionButton, SequencesGrid,
      SequencesPostsList, Divider, ContentItemBody } = Components
    if (this.state.edit) {
      return <Components.BooksEditForm
                documentId={book._id}
                successCallback={this.showBook}
                cancelCallback={this.showBook} />
    } else {
      return <div className="books-item">
        <SingleColumnSection>
          <SectionTitle title={book.title}>
            {canEdit && <SectionButton><a onClick={this.showEdit}>Edit</a></SectionButton>}
          </SectionTitle>
          {html  && <div className={classes.description}>
            <ContentItemBody dangerouslySetInnerHTML={{__html: html}}/>
          </div>}

          {book.posts && !!book.posts.length && <div className={classes.posts}>
            <SequencesPostsList posts={book.posts} />
          </div>}

          <SequencesGrid sequences={book.sequences} />
        </SingleColumnSection>
        <Divider />
      </div>
    }
  }
}

registerComponent('BooksItem', BooksItem, withStyles(styles, {name: "BooksItem"}))
