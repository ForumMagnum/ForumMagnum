import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const CodexInner = () => {
  return <Components.CollectionsPage documentId={'2izXHCrmJ684AnZ5X'} />
};

export const Codex = registerComponent('Codex', CodexInner);

declare global {
  interface ComponentTypes {
    Codex: typeof Codex
  }
}

