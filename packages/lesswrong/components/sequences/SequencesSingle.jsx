import { Components, registerComponent} from 'meteor/vulcan:core';
import React from 'react';

const SequencesSingle = ({ match: { params } }, context) => {
  return <Components.SequencesPage documentId={params._id} />
};

SequencesSingle.displayName = "SequencesSingle";

registerComponent('SequencesSingle', SequencesSingle);
