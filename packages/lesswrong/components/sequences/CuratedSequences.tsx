import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

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

