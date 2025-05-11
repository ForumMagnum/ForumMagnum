import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CollectionsPage from "./CollectionsPage";

const Codex = () => {
  return <CollectionsPage documentId={'2izXHCrmJ684AnZ5X'} />
};

export default registerComponent('Codex', Codex);



