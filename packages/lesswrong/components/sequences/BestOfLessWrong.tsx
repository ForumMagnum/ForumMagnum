import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const BestOfLessWrong = () => {
  return <Components.CollectionsPage documentId={'nmk3nLpQE89dMRzzN'} />
};

const BestOfLessWrongComponent = registerComponent('BestOfLessWrong', BestOfLessWrong);

declare global {
  interface ComponentTypes {
    BestOfLessWrong: typeof BestOfLessWrongComponent
  }
}

