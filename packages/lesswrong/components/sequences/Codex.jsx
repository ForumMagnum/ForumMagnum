import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const Codex = (props, context) => {
  return <Components.CollectionsPage documentId={'qTe79fDX6GHSrpfXN'} />
};

registerComponent('Codex', Codex);
