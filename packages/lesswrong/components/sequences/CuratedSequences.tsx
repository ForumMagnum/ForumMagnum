import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

export const CuratedSequences = () => {
  return <Components.SequencesGridWrapper
      terms={{'view':'curatedSequences', limit:3}}
      showAuthor={true}
      showLoadMore={false}
    />
}

const CuratedSequencesComponent = registerComponent('CuratedSequences', CuratedSequences);

declare global {
  interface ComponentTypes {
    CuratedSequences: typeof CuratedSequencesComponent
  }
}

