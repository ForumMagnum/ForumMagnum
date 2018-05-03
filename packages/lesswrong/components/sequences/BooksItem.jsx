import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';

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
    {book.subtitle ?   <div className="books-item-subtitle">
        {book.subtitle}
      </div> : null}
    {canEdit ? <a onTouchTap={this.showEdit}>edit</a> : null}
  </div>

  render() {
    const book = this.props.book;
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
          {book.htmlDescription && book.plaintextDescription && <div className="books-item-description">
            <div className="content-body" dangerouslySetInnerHTML={{__html: book.htmlDescription}}/>
          </div>}

          {book.posts && book.posts.length ? <div className="books-item-posts">
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

registerComponent('BooksItem', BooksItem)
