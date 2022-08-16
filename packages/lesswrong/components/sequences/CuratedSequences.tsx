import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useRecommendedSequences } from '../recommendations/withRecommendedSequences';

export const CuratedSequences = () => {
  const {loading, results} = useRecommendedSequences({count: 3})

  console.log(results)

  if (!results) return null

  return <Components.SequencesGrid
      sequences={results}
      showAuthor={true}
    />
}

const CuratedSequencesComponent = registerComponent('CuratedSequences', CuratedSequences);

declare global {
  interface ComponentTypes {
    CuratedSequences: typeof CuratedSequencesComponent
  }
}

