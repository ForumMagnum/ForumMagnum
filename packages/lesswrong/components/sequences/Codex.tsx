import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const Codex = () => {
  return <Components.CollectionsPage documentId={'2izXHCrmJ684AnZ5X'} />
};

const CodexComponent = registerComponent('Codex', Codex);

declare global {
  interface ComponentTypes {
    Codex: typeof CodexComponent
  }
}

