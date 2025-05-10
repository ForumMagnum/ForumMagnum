import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { SequencesGridWrapper } from "./SequencesGridWrapper";

export const CuratedSequencesInner = () => {
  return <SequencesGridWrapper
      terms={{'view':'curatedSequences', limit:3}}
      showAuthor={true}
      showLoadMore={false}
    />
}

export const CuratedSequences = registerComponent('CuratedSequences', CuratedSequencesInner);



