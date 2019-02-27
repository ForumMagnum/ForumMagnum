import { Components, registerComponent, withDocument, Utils } from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary.jsx';

const SequencesNavigation = ({
  document,
  documentId,
  loading,
  post
}) => {
  if (!document || loading) {
    return <Components.CollectionsNavigation loading={true}/>
  }
  
  let title = document.title;
  let titleUrl = documentId ? "/s/" + documentId : ""
  const { nextPost, prevPost } = Utils.getSequencePostLinks(document, post)
  
  return <Components.CollectionsNavigation
    nextPostUrl={nextPost && `/s/${document._id}/p/${nextPost._id}`}
    prevPostUrl={prevPost && `/s/${document._id}/p/${prevPost._id}`}
    title={title}
    titleUrl={titleUrl}
    nextPostId={nextPost && nextPost._id}
    prevPostId={prevPost && prevPost._id}
  />
}

const options = {
  collection: Sequences,
  queryName: "SequencesNavigationQuery",
  fragmentName: 'SequencesNavigationFragment',
  enableTotal: false,
  ssr: true
}

registerComponent('SequencesNavigation', SequencesNavigation, [withDocument, options], withErrorBoundary);
