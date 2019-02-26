import { Components, registerComponent , withDocument} from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import React from 'react';
import { withRouter } from 'react-router';

const SequencesPost = ({params, router}) => {
  const version = router.location && router.location.query && router.location.query.revision
  return <Components.PostsPage documentId={params.postId} sequenceId={params.sequenceId} version={version} />
};

const options = {
  collection: Sequences,
  queryName: "SequencesNavigationQuery",
  fragmentName: 'SequencesNavigationFragment',
  enableTotal: false,
}

registerComponent('SequencesPost', SequencesPost, [withDocument, options], withRouter);
