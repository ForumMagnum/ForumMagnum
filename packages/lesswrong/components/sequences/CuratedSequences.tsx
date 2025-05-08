import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

export const CuratedSequencesInner = () => {
  return <Components.SequencesGridWrapper
      terms={{'view':'curatedSequences', limit:3}}
      showAuthor={true}
      showLoadMore={false}
    />
}

export const CuratedSequences = registerComponent('CuratedSequences', CuratedSequencesInner);

declare global {
  interface ComponentTypes {
    CuratedSequences: typeof CuratedSequences
  }
}

