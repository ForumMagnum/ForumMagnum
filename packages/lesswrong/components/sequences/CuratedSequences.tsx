import React from 'react';
import SequencesGridWrapper from "./SequencesGridWrapper";

export const CuratedSequences = () => {
  return <SequencesGridWrapper
      terms={{'view':'curatedSequences', limit:3}}
      showAuthor={true}
      showLoadMore={false}
    />
}

export default CuratedSequences;



