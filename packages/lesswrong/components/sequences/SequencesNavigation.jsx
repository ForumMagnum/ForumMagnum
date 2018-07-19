import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import { Link } from 'react-router';
import React, { Component } from 'react';

class SequencesNavigation extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  
  render() {
    if (this.state.error) {
      return <div className="errorText">Error rendering sequences navigation panel: {this.state.error}</div>
    }
    
    let {document, documentId, loading, post} = this.props;
    
    let prevPostUrl = ""
    let nextPostUrl = ""

    let prevPostId = ""
    let nextPostId = ""

    let title = document ? document.title : ""
    let titleUrl = documentId ? "/sequences/" + documentId : ""

    if (document && post && !loading) {
      if (document.chapters) {
        let currentChapter = false;
        let currentPostIndex = false;
        let currentChapterIndex = false;
        let currentSequenceLength = document.chapters.length;
        document.chapters.forEach((c) => {
          if(c.posts && _.pluck(c.posts, '_id').indexOf(post._id) > -1) {
            currentChapter = c
            currentPostIndex = _.pluck(c.posts, '_id').indexOf(post._id);
            currentChapterIndex = _.pluck(document.chapters, '_id').indexOf(c._id);
          }
        })
        if (currentPostIndex || currentPostIndex === 0) {
          if (currentPostIndex + 1 < currentChapter.posts.length) {
            nextPostId = currentChapter.posts[currentPostIndex + 1]._id
            nextPostUrl = "/s/" + document._id + "/p/" + nextPostId;
          } else if (currentChapterIndex + 1 < currentSequenceLength) {
            nextPostId = document.chapters[currentChapterIndex + 1].posts[0]._id
            nextPostUrl = "/s/" + document._id + "/p/" + nextPostId;
          } else {
            nextPostUrl = "/sequences/" + document._id;
          }

          if (currentPostIndex > 0) {
            prevPostId = currentChapter.posts[currentPostIndex - 1]._id
            prevPostUrl = "/s/" + document._id + "/p/" + prevPostId;
          } else if (currentChapterIndex > 1) {
            prevPostId = document.chapters[currentChapterIndex - 1].posts[document.chapters[currentChapterIndex-1].length - 1]._id
            prevPostUrl = "/s/" + document._id + "/p/" + prevPostId;
          } else {
            prevPostUrl = "/s/" + document._id + "/p/" + document._id;
          }
        }
      }
    }
    return (
      <div className="sequences-navigation-top">
        <Components.SequencesNavigationLink
          documentId={ prevPostId }
          documentUrl={ prevPostUrl }
        direction="left" />

        <div className="sequences-navigation-title">
          {title ? <Link to={ titleUrl }>{ title }</Link> : <Components.Loading/>}
        </div>

        <Components.SequencesNavigationLink
          documentId={ nextPostId }
          documentUrl={ nextPostUrl }
        direction="right" />
      </div>
    )
  }
  
  componentDidCatch(error, info) {
    this.setState({error:error.toString()});
  }
}

const options = {
  collection: Sequences,
  queryName: "SequencesNavigationQuery",
  fragmentName: 'SequencesNavigationFragment',
  totalResolver: false,
}

registerComponent('SequencesNavigation', SequencesNavigation, [withDocument, options]);
