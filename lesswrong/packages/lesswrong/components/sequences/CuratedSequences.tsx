import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import SequencesGridWrapper from "@/components/sequences/SequencesGridWrapper";

export const CuratedSequences = () => {
  return <SequencesGridWrapper
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

export default CuratedSequencesComponent;

