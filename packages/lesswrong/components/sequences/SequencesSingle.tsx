import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const SequencesSingleInner = () => {
  const { params } = useLocation();
  return <Components.SequencesPage documentId={params._id} />
};

export const SequencesSingle = registerComponent('SequencesSingle', SequencesSingleInner);

declare global {
  interface ComponentTypes {
    SequencesSingle: typeof SequencesSingle
  }
}

