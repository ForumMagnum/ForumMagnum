import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const Codex = (props, context) => {
  return <Components.CollectionsPage documentId={'2izXHCrmJ684AnZ5X'} />
};

registerComponent('Codex', Codex);
