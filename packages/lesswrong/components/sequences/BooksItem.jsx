import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { postBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
  },
  description: {
    marginLeft: 20,
    marginRight: 28,
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

  renderTitleComponent = (book, canEdit) => <div>
    {book.subtitle ?   <div className={this.props.classes.subtitle}>
        {book.subtitle}
      </div> : null}
    {canEdit ? <a onClick={this.showEdit}>edit</a> : null}
  </div>

  render() {
    const { book, classes } = this.props;
    const { html = "" } = book.contents || {}
    if (this.state.edit) {
      return <Components.BooksEditForm
                documentId={book._id}
                successCallback={this.showBook}
                cancelCallback={this.showBook} />
    } else {
      return <div className="books-item">
        <Components.Section title={book.title}
          titleComponent={this.renderTitleComponent(book, this.props.canEdit)}
        >
          {html  && <div className={classes.description}>
            <div className="content-body" dangerouslySetInnerHTML={{__html: html}}/>
          </div>}

          {book.posts && book.posts.length ? <div className={classes.posts}>
            <Components.SequencesPostsList posts={book.posts} />
          </div> : null}

          <div className="books-item-sequences">
            <Components.SequencesGrid sequences={book.sequences} className="books-sequences-grid-list" />
          </div>
        </Components.Section>
      </div>
    }
  }
}

registerComponent('BooksItem', BooksItem, withStyles(styles, {name: "BooksItem"}))
