import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { SequencesPage } from "./SequencesPage";

const SequencesSingleInner = () => {
  const { params } = useLocation();
  return <SequencesPage documentId={params._id} />
};

export const SequencesSingle = registerComponent('SequencesSingle', SequencesSingleInner);



