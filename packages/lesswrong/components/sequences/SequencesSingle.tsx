import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import SequencesPage from "./SequencesPage";

const SequencesSingle = () => {
  const { params } = useLocation();
  return <SequencesPage documentId={params._id} />
};

export default registerComponent('SequencesSingle', SequencesSingle);



