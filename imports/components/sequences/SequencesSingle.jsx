import { Components, registerComponent} from 'meteor/vulcan:core';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const SequencesSingle = () => {
  const { params } = useLocation();
  return <Components.SequencesPage documentId={params._id} />
};

registerComponent('SequencesSingle', SequencesSingle);
