import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { CollectionsPage } from "./CollectionsPage";

const CodexInner = () => {
  return <CollectionsPage documentId={'2izXHCrmJ684AnZ5X'} />
};

export const Codex = registerComponent('Codex', CodexInner);



