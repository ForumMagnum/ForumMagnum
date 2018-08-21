import { Components, registerComponent, withDocument, Utils } from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import { Link } from 'react-router';
import React from 'react';

const SequencesNavigation = ({
    document,
    documentId,
    loading,
    post
  }) => {
    if (document && !loading) {
      let title = document ? document.title : ""
      let titleUrl = documentId ? "/s/" + documentId : ""
      const { nextPost, prevPost } = Utils.getSequencePostLinks(document, post)
      return (
        <div className="sequences-navigation-top">
          <Components.SequencesNavigationLink
            documentId={ prevPost && prevPost._id }
            documentUrl={ "/s/" + document._id + (prevPost ? ("/p/" + prevPost._id) : "")}
          direction="left" />

          <div className="sequences-navigation-title">
            {title ? <Link to={ titleUrl }>{ title }</Link> : <Components.Loading/>}
          </div>

          <Components.SequencesNavigationLink
            documentId={ nextPost && nextPost._id }
            documentUrl={ "/s/" + document._id + (nextPost ? ("/p/" + nextPost._id) : "")}
          direction="right" />
        </div>
      )
    } else {
      return <div><Components.Loading /></div>
    }
  }

const options = {
  collection: Sequences,
  queryName: "SequencesNavigationQuery",
  fragmentName: 'SequencesNavigationFragment',
  totalResolver: false,
}

registerComponent('SequencesNavigation', SequencesNavigation, [withDocument, options]);
