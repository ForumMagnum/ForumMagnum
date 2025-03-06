import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CollectionsPage from "@/components/sequences/CollectionsPage";

const Codex = () => {
  return <CollectionsPage documentId={'2izXHCrmJ684AnZ5X'} />
};

const CodexComponent = registerComponent('Codex', Codex);

declare global {
  interface ComponentTypes {
    Codex: typeof CodexComponent
  }
}

export default CodexComponent;

