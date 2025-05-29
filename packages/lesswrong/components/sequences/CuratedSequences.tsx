import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import SequencesGridWrapper from "./SequencesGridWrapper";

export const CuratedSequences = () => {
  return <SequencesGridWrapper
      terms={{'view':'curatedSequences', limit:3}}
      showAuthor={true}
      showLoadMore={false}
    />
}

export default registerComponent('CuratedSequences', CuratedSequences);



