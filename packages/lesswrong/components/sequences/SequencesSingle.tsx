import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const SequencesSingle = () => {
  const { params } = useLocation();
  return <Components.SequencesPage documentId={params._id} />
};

const SequencesSingleComponent = registerComponent('SequencesSingle', SequencesSingle);

declare global {
  interface ComponentTypes {
    SequencesSingle: typeof SequencesSingleComponent
  }
}

